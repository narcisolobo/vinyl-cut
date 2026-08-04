"""One-off migration: re-host existing product images on Supabase Storage.

`load_catalog.py`'s original run uploaded images through Medusa's default
Local file provider (disk, served from `/static/...`). Once the backend's
File Module is reconfigured to the S3 provider (Supabase Storage), new
uploads go to the new host automatically -- but the ~500 products already
loaded still have `images[].url`/`thumbnail` pointing at the old local
path. This script re-uploads each product's existing images through the
now-S3-backed `/admin/uploads` endpoint and updates the product to point
at the new URLs.

It does NOT touch MusicBrainz or the Cover Art Archive -- images are
re-fetched from the old (still-serving) local URLs, not re-downloaded from
CAA, and no variant/price/category/option data is touched. Safe to re-run:
a product whose images already live on the configured file host is skipped.

Usage (from etl/):
    python tools/migrate_images_to_s3.py                  # full run
    python tools/migrate_images_to_s3.py --limit 5         # smoke test
    python tools/migrate_images_to_s3.py --dry-run         # report only, no writes

Config (etl/.env):
    MEDUSA_BASE_URL         default http://localhost:9000
    MEDUSA_ADMIN_API_KEY    a Medusa secret API key (see etl/.env.example)
    NEW_FILE_HOST           substring identifying the new host, e.g.
                             "localhost:54321" -- products whose image URLs
                             already contain this are skipped as done
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests
from dotenv import load_dotenv

from load_catalog import LoadStageError, MedusaAdminClient

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
LOG_PATH = SEED_DIR / "migrate_images_run.log"
ERRORS_PATH = SEED_DIR / "migrate_images_errors.json"


def safe_filename(url: str) -> str:
    """Supabase's S3 gateway rejects `%` (and possibly other characters) in
    object keys. `urlparse().path` gives back the percent-encoded form (a
    space in a catalog number becomes `%20`), so decode it first, then
    replace anything outside a conservative safe set -- covers whatever
    stray characters MusicBrainz catalog numbers happen to contain across
    the whole catalog, not just the one that surfaced in testing."""
    decoded = unquote(Path(urlparse(url).path).name)
    return re.sub(r"[^A-Za-z0-9._-]", "-", decoded)


def migrate_product_images(client: MedusaAdminClient, product: dict, dry_run: bool) -> str:
    images = product.get("images") or []
    if not images:
        return "skipped (no images)"

    new_images = []
    for image in images:
        old_url = image["url"]
        filename = safe_filename(old_url)
        if dry_run:
            new_images.append({"url": old_url})
            continue

        resp = requests.get(old_url, timeout=30)
        if not resp.ok:
            raise LoadStageError(f"could not fetch existing image {old_url} -> {resp.status_code}")

        new_url = client.upload_file(filename, resp.content)
        new_images.append({"url": new_url})

    if dry_run:
        return f"would migrate {len(new_images)} image(s)"

    client.update_product(product["id"], {"images": new_images, "thumbnail": new_images[0]["url"]})
    return f"migrated {len(new_images)} image(s)"


def main():
    parser = argparse.ArgumentParser(description="Re-host existing product images on the newly-configured file provider.")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N products (smoke test).")
    parser.add_argument("--dry-run", action="store_true", help="Report what would migrate; skip uploads and writes.")
    args = parser.parse_args()

    load_dotenv()

    base_url = os.environ.get("MEDUSA_BASE_URL", "http://localhost:9000")
    api_key = os.environ.get("MEDUSA_ADMIN_API_KEY")
    if not api_key:
        raise SystemExit("MEDUSA_ADMIN_API_KEY env var is required (see etl/.env.example to mint one)")
    new_file_host = os.environ.get("NEW_FILE_HOST")
    if not new_file_host:
        raise SystemExit("NEW_FILE_HOST env var is required, e.g. NEW_FILE_HOST=localhost:54321")

    client = MedusaAdminClient(base_url, api_key)
    products = client.list_all_products(fields="id,title,images.url,thumbnail")
    if args.limit:
        products = products[: args.limit]

    already_migrated = migrated = failed = 0
    errors = []
    log_lines = []

    for i, product in enumerate(products, start=1):
        label = f"{product['title']} ({product['id']})"
        images = product.get("images") or []
        if images and all(new_file_host in image["url"] for image in images):
            already_migrated += 1
            line = f"[{i}/{len(products)}] {label}: already migrated"
            print(line)
            log_lines.append(line)
            continue

        try:
            outcome = migrate_product_images(client, product, args.dry_run)
            migrated += 1
            line = f"[{i}/{len(products)}] {label}: {outcome}"
        except Exception as exc:  # noqa: BLE001 - per-product isolation: never halt the batch
            failed += 1
            line = f"[{i}/{len(products)}] {label}: FAILED - {exc!r}"
            errors.append({"product_id": product["id"], "title": product["title"], "error": repr(exc)})

        print(line)
        log_lines.append(line)

    summary = f"\nAlready migrated: {already_migrated}\nMigrated: {migrated}\nFailed:   {failed}\n"
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
