"""The Vinyl Cut catalog ETL pipeline.

Extracts release metadata from MusicBrainz and cover art from the Cover Art
Archive for each MBID in the curated seed file, fabricates the retail data
neither source provides (condition variants, price, quantity), and loads
everything into Medusa through its Admin REST API. See
notes/vinyl_cut_etl_pipeline.html for the full spec this implements.

Usage (from etl/):
    python tools/load_catalog.py                  # full run
    python tools/load_catalog.py --limit 5         # smoke test
    python tools/load_catalog.py --mbid <mbid>      # single record
    python tools/load_catalog.py --dry-run          # extract+transform only, no Medusa writes
    python tools/load_catalog.py --reset            # wipe all products/categories, then full run

Config (etl/.env):
    MB_CONTACT             required by MusicBrainz/CAA API etiquette
    MEDUSA_BASE_URL         default http://localhost:9000
    MEDUSA_ADMIN_API_KEY    a Medusa secret API key (see etl/.env.example to mint one)
"""

import argparse
import json
import os
import random
import re
import sys
import time
import unicodedata
from pathlib import Path

import musicbrainzngs
import requests
from dotenv import load_dotenv
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from genres import genre_for

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
SEED_PATH = SEED_DIR / "seed.json"
LOG_PATH = SEED_DIR / "load_run.log"
ERRORS_PATH = SEED_DIR / "load_errors.json"

CAA_FRONT_URL = "https://coverartarchive.org/release/{mbid}/front-{size}"
CAA_RELEASE_GROUP_FRONT_URL = "https://coverartarchive.org/release-group/{mbid}/front-{size}"
CAA_METADATA_URL = "https://coverartarchive.org/release/{mbid}"
CAA_REQUEST_INTERVAL = 1.0

CONDITIONS_USED = ["M", "NM", "VG+", "VG", "G"]
CONDITION_GRADES = ["New", "M", "NM", "VG+", "VG", "G"]
USED_PRICE_FACTOR = {"M": 0.85, "NM": 0.70, "VG+": 0.50, "VG": 0.35, "G": 0.20}
NEW_PRICE_RANGE_CENTS = (2200, 4200)
ERAS_ROOT_CATEGORY_NAME = "Eras"

_last_caa_call = 0.0


class NonRetryableError(Exception):
    """A per-record failure that should not be retried (bad MBID, 404, malformed row)."""

    def __init__(self, stage: str, message: str):
        super().__init__(message)
        self.stage = stage


class LoadStageError(Exception):
    """A failure at the Medusa Admin API load stage, distinct from extract/transform."""

    def __init__(self, message: str, payload: dict | None = None):
        super().__init__(message)
        self.payload = payload


def user_agent_contact() -> str:
    contact = os.environ.get("MB_CONTACT")
    if not contact:
        raise SystemExit("MB_CONTACT env var is required (email or URL, per MusicBrainz/CAA API etiquette)")
    return contact


def configure_musicbrainz():
    musicbrainzngs.set_useragent("TheVinylCutETL", "0.1", user_agent_contact())


def throttle_caa():
    global _last_caa_call
    elapsed = time.monotonic() - _last_caa_call
    if elapsed < CAA_REQUEST_INTERVAL:
        time.sleep(CAA_REQUEST_INTERVAL - elapsed)
    _last_caa_call = time.monotonic()


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "untitled"


# ---------------------------------------------------------------------------
# Extract
# ---------------------------------------------------------------------------

@retry(
    retry=retry_if_exception_type((musicbrainzngs.NetworkError,)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
def _mb_get_release(mbid: str) -> dict:
    try:
        return musicbrainzngs.get_release_by_id(mbid, includes=["labels", "recordings", "artist-credits", "release-groups"])["release"]
    except musicbrainzngs.ResponseError as exc:
        code = getattr(exc.cause, "code", None)
        if code in (429, 500, 502, 503, 504):
            raise musicbrainzngs.NetworkError(str(exc)) from exc
        raise NonRetryableError("extract", f"MusicBrainz error for release {mbid}: {exc}") from exc


def fetch_release_metadata(mbid: str) -> dict:
    release = _mb_get_release(mbid)

    label_info = (release.get("label-info-list") or [{}])[0]
    label = (label_info.get("label") or {}).get("name")
    catalog_number = label_info.get("catalog-number")

    tracklist = []
    for medium in release.get("medium-list", []):
        press_format = medium.get("format")
        for track in medium.get("track-list", []):
            recording = track.get("recording", {})
            tracklist.append(
                {
                    "position": track.get("number"),
                    "title": recording.get("title") or track.get("title"),
                    "length_ms": int(track.get("length") or recording.get("length") or 0) or None,
                }
            )

    press_type = release.get("medium-list", [{}])[0].get("format")
    release_date = release.get("date") or ""
    release_year = release_date[:4] if release_date[:4].isdigit() else None

    return {
        "title": release.get("title"),
        "artist": release.get("artist-credit-phrase"),
        "label": label,
        "catalog_number": catalog_number,
        "press_type": press_type,
        "release_year": release_year,
        "tracklist": tracklist,
        "release_group_mbid": release.get("release-group", {}).get("id"),
    }


@retry(
    retry=retry_if_exception_type(requests.exceptions.RequestException),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
def _caa_get(url: str) -> requests.Response:
    throttle_caa()
    resp = requests.get(url, headers={"User-Agent": user_agent_contact()}, timeout=20)
    if resp.status_code == 404:
        raise NonRetryableError("extract", f"CAA 404 for {url}")
    resp.raise_for_status()
    return resp


def fetch_front_cover(mbid: str, release_group_mbid: str | None = None) -> dict[str, bytes] | None:
    """Some releases -- often older or various-edition vinyl pressings --
    have no front-tagged scan at the release level in CAA, even when a
    sibling release in the same release-group does (e.g. AC/DC's "Back in
    Black", MBID f7c680af-5b09-3fea-be84-5e00a7da56a0: only back/label
    scans at the release level, but CAA's release-group endpoint resolves
    to a front scan from a different pressing). Falls back to that
    release-group aggregate endpoint when the release-level fetch 404s.

    Some releases have no front art anywhere in CAA, at either level --
    that's not a failure either, matching fetch_back_cover's handling:
    returns None so the product loads with no images (or just a back
    cover) rather than blocking the whole row, and can be filled in by
    hand later (e.g. via the admin dashboard)."""
    try:
        return {
            "250": _caa_get(CAA_FRONT_URL.format(mbid=mbid, size=250)).content,
            "500": _caa_get(CAA_FRONT_URL.format(mbid=mbid, size=500)).content,
        }
    except NonRetryableError:
        if not release_group_mbid:
            return None
        try:
            return {
                "250": _caa_get(CAA_RELEASE_GROUP_FRONT_URL.format(mbid=release_group_mbid, size=250)).content,
                "500": _caa_get(CAA_RELEASE_GROUP_FRONT_URL.format(mbid=release_group_mbid, size=500)).content,
            }
        except NonRetryableError:
            return None


def fetch_back_cover(mbid: str) -> dict[str, bytes] | None:
    """Best-effort: roughly 58% of releases have a back cover in CAA. A missing
    one is not a failure, just a single-image gallery (see pipeline doc)."""
    try:
        resp = _caa_get(CAA_METADATA_URL.format(mbid=mbid))
    except NonRetryableError:
        return None
    images = resp.json().get("images", [])
    back_image = next((img for img in images if img.get("back")), None)
    if back_image is None:
        return None
    thumbnails = back_image.get("thumbnails", {})
    if "250" not in thumbnails or "500" not in thumbnails:
        return None
    return {
        "250": _caa_get(thumbnails["250"]).content,
        "500": _caa_get(thumbnails["500"]).content,
    }


def load_seed(path: Path) -> list[dict]:
    with open(path) as f:
        rows = json.load(f)
    for row in rows:
        for field in ("mbid", "rank", "title", "artist"):
            if not row.get(field):
                raise NonRetryableError("extract", f"malformed seed row, missing '{field}': {row}")
    return rows


# ---------------------------------------------------------------------------
# Transform
# ---------------------------------------------------------------------------

def format_duration(length_ms: int | None) -> str:
    if not length_ms:
        return "?:??"
    total_seconds = length_ms // 1000
    return f"{total_seconds // 60}:{total_seconds % 60:02d}"


def build_description(seed_row: dict, mb: dict) -> str:
    artist = mb["artist"] or seed_row["artist"]
    title = mb["title"] or seed_row["title"]
    header_bits = [b for b in [mb["release_year"], mb["label"], mb["catalog_number"], mb["press_type"]] if b]
    lines = [f"{artist} — {title}", " · ".join(header_bits)]
    if mb["tracklist"]:
        lines.append("")
        lines.append("Tracklist:")
        for track in mb["tracklist"]:
            position = f"{track['position']}. " if track["position"] else ""
            lines.append(f"{position}{track['title']} ({format_duration(track['length_ms'])})")
    return "\n".join(lines)


def fabricate_variants(mbid: str, seed_rank: str) -> list[dict]:
    """Generates 1-3 condition variants with fabricated price/quantity, since
    neither MusicBrainz nor CAA supplies retail data. Seeded per-mbid so a
    given release fabricates the same variants on every run (first-create
    only; see load-stage idempotency notes on why this doesn't matter for
    already-created products)."""
    rng = random.Random(f"{mbid}:{seed_rank}")

    n_variants = rng.choices([1, 2, 3], weights=[0.3, 0.4, 0.3])[0]
    include_new = rng.random() < 0.75
    if include_new:
        used_needed = max(0, n_variants - 1)
        conditions = ["New"] + rng.sample(CONDITIONS_USED, k=min(used_needed, len(CONDITIONS_USED)))
    else:
        conditions = rng.sample(CONDITIONS_USED, k=min(n_variants, len(CONDITIONS_USED)))

    new_price = rng.randint(*NEW_PRICE_RANGE_CENTS)

    variants = []
    for condition in conditions:
        if condition == "New":
            price = new_price
            quantity = rng.randint(3, 15)
        else:
            factor = USED_PRICE_FACTOR[condition] * rng.uniform(0.9, 1.1)
            price = max(300, round(new_price * factor / 25) * 25)
            # Deliberately zero out a handful of used variants so the
            # restock-notify flow has something to demo against immediately.
            quantity = rng.choices([0, 1, 1, 1, 2, 3], weights=[1, 3, 3, 3, 1, 1])[0]
        variants.append({"condition": condition, "price_cents": price, "quantity": quantity})
    return variants


def decade_for(release_year: str | None) -> str | None:
    """Buckets a release year into a decade label ("1977" -> "1970s") for the
    Eras taxonomy. Returns None when the year is unknown -- there's no sensible
    default decade to fabricate, unlike genre's curated fallback."""
    if not release_year:
        return None
    return f"{(int(release_year) // 10) * 10}s"


def transform(seed_row: dict, mb: dict) -> dict:
    artist = mb["artist"] or seed_row["artist"]
    title = mb["title"] or seed_row["title"]
    genre, was_curated = genre_for(seed_row["artist"], seed_row["mbid"])
    if not was_curated:
        print(f"  [warn] no curated genre for artist '{seed_row['artist']}', defaulting to '{genre}'")

    return {
        "title": title,
        "artist": artist,
        "handle": slugify(f"{artist}-{title}"),
        "description": build_description(seed_row, mb),
        "genre": genre,
        "decade": decade_for(mb["release_year"]),
        "metadata": {
            "label": mb["label"],
            "catalog_number": mb["catalog_number"],
            "release_year": mb["release_year"],
            "press_type": mb["press_type"],
            "tracklist": mb["tracklist"],
        },
        "variants": fabricate_variants(seed_row["mbid"], seed_row["rank"]),
    }


# ---------------------------------------------------------------------------
# Load (Medusa Admin API)
# ---------------------------------------------------------------------------

class MedusaAdminClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.auth = (api_key, "")
        self._category_cache: dict[tuple[str, str | None], str] = {}
        self._condition_option: tuple[str, dict[str, str]] | None = None

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.base_url}{path}"
        resp = requests.request(method, url, auth=self.auth, timeout=30, **kwargs)
        if not resp.ok:
            raise LoadStageError(f"{method} {path} -> {resp.status_code}: {resp.text[:500]}", payload=kwargs.get("json"))
        if not resp.content:
            return {}
        return resp.json()

    def find_sales_channel_id(self, preferred_name: str) -> str:
        data = self._request("GET", "/admin/sales-channels")
        channels = data.get("sales_channels", [])
        if not channels:
            raise LoadStageError("no sales channels exist; run the Phase 1 bootstrap seed first")
        match = next((c for c in channels if c["name"] == preferred_name), channels[0])
        return match["id"]

    def find_stock_location_id(self, preferred_name: str) -> str:
        data = self._request("GET", "/admin/stock-locations")
        locations = data.get("stock_locations", [])
        if not locations:
            raise LoadStageError("no stock locations exist; run the Phase 1 bootstrap seed first")
        match = next((l for l in locations if l["name"] == preferred_name), locations[0])
        return match["id"]

    def find_shipping_profile_id(self) -> str:
        data = self._request("GET", "/admin/shipping-profiles")
        profiles = data.get("shipping_profiles", [])
        if not profiles:
            raise LoadStageError("no shipping profiles exist; run the Phase 1 bootstrap seed first")
        match = next((p for p in profiles if p["type"] == "default"), profiles[0])
        return match["id"]

    def find_product_by_external_id(self, mbid: str) -> dict | None:
        data = self._request("GET", "/admin/products", params={"external_id": mbid, "limit": 1})
        products = data.get("products", [])
        return products[0] if products else None

    def get_product(self, product_id: str) -> dict:
        data = self._request(
            "GET",
            f"/admin/products/{product_id}",
            params={"fields": "id,title,subtitle,external_id"},
        )
        return data["product"]

    def find_products_by_title(self, query: str) -> list[dict]:
        data = self._request(
            "GET",
            "/admin/products",
            params={"q": query, "fields": "id,title,subtitle,external_id"},
        )
        return data.get("products", [])

    def get_or_create_category(self, name: str, parent_category_id: str | None = None) -> str:
        cache_key = (name, parent_category_id)
        if cache_key in self._category_cache:
            return self._category_cache[cache_key]
        # Medusa derives a category's handle as name.lower() verbatim by default
        # (not a real slug -- punctuation like "&" and "/" survives, and "/" in
        # particular collides with handle-as-URL-path-segment conventions), so
        # supply an explicit slugified handle instead of trusting the default.
        handle = slugify(name)
        data = self._request("GET", "/admin/product-categories", params={"handle": handle})
        existing = data.get("product_categories", [])
        if existing:
            category_id = existing[0]["id"]
        else:
            payload = {"name": name, "handle": handle, "is_active": True}
            if parent_category_id:
                payload["parent_category_id"] = parent_category_id
            created = self._request("POST", "/admin/product-categories", json=payload)
            category_id = created["product_category"]["id"]
        self._category_cache[cache_key] = category_id
        return category_id

    def get_or_create_condition_option(self) -> tuple[str, dict[str, str]]:
        """Returns (option_id, {grade_label: option_value_id}) for a single,
        store-wide "Condition" option shared by every product. Product options
        default to exclusive/private-to-one-product unless explicitly created
        as shared (is_exclusive=False) -- see notes/vinyl_cut_etl_pipeline.html
        for why the original inline per-product option definition was wrong."""
        if self._condition_option is not None:
            return self._condition_option
        data = self._request(
            "GET",
            "/admin/product-options",
            params={"title": "Condition", "is_exclusive": "false", "fields": "*values"},
        )
        existing = data.get("product_options", [])
        if existing:
            option = existing[0]
        else:
            option = self._request(
                "POST",
                "/admin/product-options",
                json={"title": "Condition", "is_exclusive": False, "values": CONDITION_GRADES},
            )["product_option"]
        self._condition_option = (option["id"], {v["value"]: v["id"] for v in option["values"]})
        return self._condition_option

    def list_all_products(self, fields: str = "id") -> list[dict]:
        products, offset, limit = [], 0, 200
        while True:
            data = self._request("GET", "/admin/products", params={"limit": limit, "offset": offset, "fields": fields})
            batch = data.get("products", [])
            products.extend(batch)
            if len(batch) < limit:
                return products
            offset += limit

    def delete_product(self, product_id: str):
        self._request("DELETE", f"/admin/products/{product_id}")

    def list_all_categories(self) -> list[dict]:
        data = self._request("GET", "/admin/product-categories", params={"limit": 200, "fields": "id,parent_category_id"})
        return data.get("product_categories", [])

    def delete_category(self, category_id: str):
        self._request("DELETE", f"/admin/product-categories/{category_id}")

    def upload_file(self, filename: str, content: bytes, content_type: str = "image/jpeg") -> str:
        resp = requests.post(
            f"{self.base_url}/admin/uploads",
            auth=self.auth,
            files={"files": (filename, content, content_type)},
            timeout=30,
        )
        if not resp.ok:
            raise LoadStageError(f"file upload failed for {filename} -> {resp.status_code}: {resp.text[:500]}")
        return resp.json()["files"][0]["url"]

    def create_product(self, payload: dict) -> dict:
        return self._request("POST", "/admin/products", json=payload)["product"]

    def update_product(self, product_id: str, payload: dict) -> dict:
        return self._request("POST", f"/admin/products/{product_id}", json=payload)["product"]

    def set_inventory_level(self, sku: str, location_id: str, quantity: int):
        data = self._request("GET", "/admin/inventory-items", params={"sku": sku, "limit": 1})
        items = data.get("inventory_items", [])
        if not items:
            raise LoadStageError(f"no inventory item found for sku {sku} after product creation")
        item_id = items[0]["id"]
        self._request(
            "POST",
            f"/admin/inventory-items/{item_id}/location-levels",
            json={"location_id": location_id, "stocked_quantity": quantity},
        )


def build_images(
    mbid: str, sku_prefix: str, client: MedusaAdminClient, front: dict | None, back: dict | None
) -> tuple[list[dict], str | None]:
    images = []
    if front:
        for size in ("250", "500"):
            url = client.upload_file(f"{sku_prefix}-front-{size}.jpg", front[size])
            images.append({"url": url})
    if back:
        for size in ("250", "500"):
            url = client.upload_file(f"{sku_prefix}-back-{size}.jpg", back[size])
            images.append({"url": url})
    thumbnail = images[0]["url"] if images else None
    return images, thumbnail


CONDITION_SLUG = {"New": "new", "M": "m", "NM": "nm", "VG+": "vgp", "VG": "vg", "G": "g"}


def build_variant_payloads(mbid: str, variants: list[dict]) -> list[dict]:
    sku_prefix = mbid[:8].upper()
    return [
        {
            "title": v["condition"],
            "sku": f"{sku_prefix}-{CONDITION_SLUG[v['condition']]}",
            "options": {"Condition": v["condition"]},
            "manage_inventory": True,
            "prices": [{"currency_code": "usd", "amount": v["price_cents"]}],
        }
        for v in variants
    ]


def build_category_refs(client: MedusaAdminClient, record: dict) -> list[dict]:
    refs = [{"id": client.get_or_create_category(record["genre"])}]
    if record["decade"]:
        eras_root_id = client.get_or_create_category(ERAS_ROOT_CATEGORY_NAME)
        refs.append({"id": client.get_or_create_category(record["decade"], parent_category_id=eras_root_id)})
    return refs


def create_new_product(
    client: MedusaAdminClient,
    seed_row: dict,
    record: dict,
    front: dict | None,
    back: dict | None,
    sales_channel_id: str,
    stock_location_id: str,
    shipping_profile_id: str,
) -> dict:
    sku_prefix = record["metadata"].get("catalog_number") or seed_row["mbid"][:8].upper()
    images, thumbnail = build_images(seed_row["mbid"], sku_prefix, client, front, back)
    condition_option_id, condition_value_ids = client.get_or_create_condition_option()
    option_value_ids = [condition_value_ids[v["condition"]] for v in record["variants"]]

    payload = {
        "title": record["title"],
        "subtitle": record["artist"],
        "handle": record["handle"],
        "description": record["description"],
        "status": "published",
        "external_id": seed_row["mbid"],
        "metadata": record["metadata"],
        "images": images,
        "thumbnail": thumbnail,
        "categories": build_category_refs(client, record),
        "shipping_profile_id": shipping_profile_id,
        "sales_channels": [{"id": sales_channel_id}],
        "options": [{"id": condition_option_id, "value_ids": option_value_ids}],
        "variants": build_variant_payloads(seed_row["mbid"], record["variants"]),
    }
    product = client.create_product(payload)

    for variant, variant_payload in zip(record["variants"], payload["variants"]):
        client.set_inventory_level(variant_payload["sku"], stock_location_id, variant["quantity"])

    return product


def update_existing_product(client: MedusaAdminClient, existing: dict, seed_row: dict, record: dict, front: dict | None, back: dict | None) -> dict:
    """Only static catalog metadata is upserted on re-run. Price and quantity
    are commerce-sensitive and set only at first creation (see pipeline doc's
    Load/Idempotency section) -- variants are intentionally left untouched."""
    sku_prefix = record["metadata"].get("catalog_number") or seed_row["mbid"][:8].upper()
    images, thumbnail = build_images(seed_row["mbid"], sku_prefix, client, front, back)

    payload = {
        "title": record["title"],
        "subtitle": record["artist"],
        "description": record["description"],
        "metadata": record["metadata"],
        "images": images,
        "thumbnail": thumbnail,
        "categories": build_category_refs(client, record),
    }
    return client.update_product(existing["id"], payload)


def reset_catalog(client: MedusaAdminClient):
    """Wipes all products and categories so a fresh run starts clean. Needed
    when the load-time payload shape changes in a way that only applies to
    newly-created products -- update_existing_product intentionally never
    touches options or category structure on re-run, only static metadata,
    so an in-place re-run can't migrate existing rows onto a new shape."""
    products = client.list_all_products()
    print(f"Deleting {len(products)} existing products...")
    for i, product in enumerate(products, start=1):
        client.delete_product(product["id"])
        if i % 50 == 0 or i == len(products):
            print(f"  deleted {i}/{len(products)} products")

    categories = client.list_all_categories()
    # Children before parents, so a parent category is never deleted while
    # a decade category still references it via parent_category_id.
    children = [c for c in categories if c.get("parent_category_id")]
    roots = [c for c in categories if not c.get("parent_category_id")]
    print(f"Deleting {len(categories)} existing categories...")
    for category in children + roots:
        client.delete_category(category["id"])
    print("Reset complete.\n")


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def process_row(client: MedusaAdminClient, seed_row: dict, channel_ids: tuple[str, str, str], dry_run: bool) -> str:
    sales_channel_id, stock_location_id, shipping_profile_id = channel_ids
    mbid = seed_row["mbid"]

    mb = fetch_release_metadata(mbid)
    front = fetch_front_cover(mbid, mb.get("release_group_mbid"))
    if front is None:
        print(f"  [warn] no front cover art in CAA for {mbid} (release or release-group) -- loading with no images")
    back = fetch_back_cover(mbid)
    record = transform(seed_row, mb)

    if dry_run:
        return f"dry-run ok ({len(record['variants'])} variants, genre={record['genre']})"

    existing = client.find_product_by_external_id(mbid)
    if existing:
        update_existing_product(client, existing, seed_row, record, front, back)
        return "updated"
    else:
        create_new_product(client, seed_row, record, front, back, sales_channel_id, stock_location_id, shipping_profile_id)
        return "created"


def main():
    parser = argparse.ArgumentParser(description="Load The Vinyl Cut's catalog into Medusa from the curated seed file.")
    parser.add_argument("--seed", type=Path, default=SEED_PATH, help="Path to the seed JSON file.")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N rows (smoke test).")
    parser.add_argument("--mbid", type=str, default=None, help="Only process a single MBID (debugging a failure).")
    parser.add_argument("--dry-run", action="store_true", help="Run extract+transform only; skip all Medusa writes.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete all existing products and categories before loading (required after option/category shape changes, since re-runs never migrate existing rows).",
    )
    args = parser.parse_args()

    if args.reset and args.dry_run:
        raise SystemExit("--reset cannot be combined with --dry-run")

    load_dotenv()
    configure_musicbrainz()

    base_url = os.environ.get("MEDUSA_BASE_URL", "http://localhost:9000")
    api_key = os.environ.get("MEDUSA_ADMIN_API_KEY")
    if not args.dry_run and not api_key:
        raise SystemExit("MEDUSA_ADMIN_API_KEY env var is required (see etl/.env.example to mint one)")

    rows = load_seed(args.seed)
    if args.mbid:
        rows = [r for r in rows if r["mbid"] == args.mbid]
        if not rows:
            raise SystemExit(f"no seed row with mbid {args.mbid}")
    if args.limit:
        rows = rows[: args.limit]

    client = None
    channel_ids = ("", "", "")
    if not args.dry_run:
        client = MedusaAdminClient(base_url, api_key)
        if args.reset:
            reset_catalog(client)
        channel_ids = (
            client.find_sales_channel_id("Default Sales Channel"),
            client.find_stock_location_id("The Vinyl Cut Warehouse"),
            client.find_shipping_profile_id(),
        )

    created = updated = failed = 0
    errors = []
    log_lines = []

    for i, row in enumerate(rows, start=1):
        label = f"#{row['rank']} {row['artist']} - {row['title']}"
        try:
            outcome = process_row(client, row, channel_ids, args.dry_run)
            if outcome == "created":
                created += 1
            elif outcome == "updated":
                updated += 1
            line = f"[{i}/{len(rows)}] {label} ({row['mbid']}): {outcome}"
        except NonRetryableError as exc:
            failed += 1
            line = f"[{i}/{len(rows)}] {label} ({row['mbid']}): FAILED at {exc.stage} - {exc}"
            errors.append({**row, "stage": exc.stage, "error": str(exc)})
        except LoadStageError as exc:
            failed += 1
            line = f"[{i}/{len(rows)}] {label} ({row['mbid']}): FAILED at load - {exc}"
            errors.append({**row, "stage": "load", "error": str(exc), "payload": exc.payload})
        except Exception as exc:  # noqa: BLE001 - per-record isolation: never halt the batch
            failed += 1
            line = f"[{i}/{len(rows)}] {label} ({row['mbid']}): FAILED unexpectedly - {exc!r}"
            errors.append({**row, "stage": "unknown", "error": repr(exc)})

        print(line)
        log_lines.append(line)

    summary = f"\nCreated: {created}\nUpdated: {updated}\nFailed:  {failed}\n"
    print(summary)
    log_lines.append(summary)

    if not args.dry_run:
        SEED_DIR.mkdir(parents=True, exist_ok=True)
        LOG_PATH.write_text("\n".join(log_lines) + "\n")
        ERRORS_PATH.write_text(json.dumps(errors, indent=2))
        print(f"Run log: {LOG_PATH}")
        print(f"Errors:  {ERRORS_PATH}")

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
