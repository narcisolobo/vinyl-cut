"""Replace a mis-seeded release with the correct MusicBrainz release.

Protocol for a recurring class of fix: at initial seed time, MusicBrainz/
CAA matched the wrong specific release for a curated title -- most often
a 7" single instead of the studio album (seen so far: AC/DC "Back in
Black", Bruce Springsteen "Born to Run"). The seed row's curated artist/
title/rank were fine; only the *mbid* pointed at the wrong release. This
script does not make the judgment call of which MBID is correct -- that's
on you, via MusicBrainz's own site -- it automates the mechanical steps
once you have it:

    1. Find the currently-wrong product in Medusa -- by a title search
       (--title), or directly by --product-id when the title is too
       generic to search on (e.g. "1999" also matches release-year
       mentions in unrelated products' descriptions).
    2. Validate --new-mbid resolves to a real MusicBrainz *release* (not
       a release-group or other entity -- a common copy-paste mix-up,
       since MusicBrainz keeps separate ID namespaces for each).
    3. Update the matching etl/seed/seed.json row's mbid.
    4. Dry-run load_catalog.py against just that row, to confirm
       extract+transform succeeds -- including real front cover art
       (falling back to the release-group's aggregate art when the
       specific release has none, e.g. an old vinyl pressing with only
       back/label scans in CAA) -- before writing anything.
    5. Without --apply, stop here and print what WOULD happen.
    6. With --apply: delete the old product (its handle would otherwise
       collide with the replacement -- Medusa enforces unique handles),
       then run load_catalog.py for real.

Usage (from etl/):
    python tools/replace_release.py --title "Born to Run" --new-mbid <mbid>
    python tools/replace_release.py --title "Born to Run" --new-mbid <mbid> --apply
    python tools/replace_release.py --product-id prod_xxx --new-mbid <mbid> --apply

Config (etl/.env): same as load_catalog.py --
    MEDUSA_BASE_URL         default http://localhost:9000
    MEDUSA_ADMIN_API_KEY    a Medusa secret API key (see etl/.env.example)

Note: the replacement product's created_at is `now()` -- separate from
the rank-biased distribution set up by randomize_created_at.py. That
script should be re-run once you're done fixing individual releases, not
after each one.
"""

import argparse
import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from load_catalog import (
    MedusaAdminClient,
    configure_musicbrainz,
    process_row,
    user_agent_contact,
)


class TransientMusicBrainzError(Exception):
    """A non-404 failure fetching from MusicBrainz -- seen in practice as
    an intermittent hiccup on an MBID that resolves fine moments later,
    not a real "not found". Worth retrying rather than surfacing as a
    bad MBID (see load_catalog.py's own _mb_get_release, which retries
    for the same reason)."""


@retry(
    retry=retry_if_exception_type(TransientMusicBrainzError),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
def _mb_get(url: str, headers: dict) -> requests.Response:
    resp = requests.get(url, params={"fmt": "json"}, headers=headers, timeout=20)
    if resp.status_code == 404:
        return resp
    if not resp.ok:
        raise TransientMusicBrainzError(f"{url} -> {resp.status_code}")
    return resp

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
SEED_PATH = SEED_DIR / "seed.json"


def validate_new_mbid(mbid: str) -> dict:
    """Confirms `mbid` is a real MusicBrainz *release*, not a
    release-group or other entity -- MusicBrainz's release and
    release-group pages look similar enough to copy the wrong ID from."""
    headers = {"User-Agent": user_agent_contact()}
    resp = _mb_get(f"https://musicbrainz.org/ws/2/release/{mbid}", headers)
    if resp.ok:
        return resp.json()

    rg_resp = _mb_get(f"https://musicbrainz.org/ws/2/release-group/{mbid}", headers)
    if rg_resp.ok:
        raise SystemExit(
            f"{mbid} is a MusicBrainz *release-group* ID, not a release ID -- "
            "pick a specific release/edition from that group's release list."
        )
    raise SystemExit(f"{mbid} doesn't resolve to a MusicBrainz release or release-group. Double check it.")


def update_seed_mbid(old_mbid: str, new_mbid: str) -> dict:
    """Idempotent: if a previous run already got this far before failing
    at a later step (e.g. the dry-run), the row will already carry
    new_mbid -- re-running should pick up from there, not error out
    because old_mbid is no longer present."""
    rows = json.loads(SEED_PATH.read_text())
    for row in rows:
        if row["mbid"] == new_mbid:
            return row
    for row in rows:
        if row["mbid"] == old_mbid:
            row["mbid"] = new_mbid
            SEED_PATH.write_text(json.dumps(rows, indent=2) + "\n")
            return row
    raise SystemExit(f"No seed.json row has mbid {old_mbid} or {new_mbid}")


def main():
    parser = argparse.ArgumentParser(
        description="Replace a mis-seeded release (wrong MusicBrainz release matched at load time) with the correct one."
    )
    parser.add_argument("--title", help="Search string matching the currently-wrong product's title in Medusa.")
    parser.add_argument(
        "--product-id",
        help="The currently-wrong product's Medusa ID, e.g. prod_xxx -- use this instead of --title when the "
        "title is too generic to search on (matches other products' descriptions too).",
    )
    parser.add_argument("--new-mbid", required=True, help="The correct MusicBrainz release MBID.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually delete the old product and create the replacement. Without this, only previews.",
    )
    args = parser.parse_args()

    if bool(args.title) == bool(args.product_id):
        raise SystemExit("Pass exactly one of --title or --product-id")

    load_dotenv()
    configure_musicbrainz()
    base_url = os.environ.get("MEDUSA_BASE_URL", "http://localhost:9000")
    api_key = os.environ.get("MEDUSA_ADMIN_API_KEY")
    if not api_key:
        raise SystemExit("MEDUSA_ADMIN_API_KEY env var is required (see etl/.env.example to mint one)")

    client = MedusaAdminClient(base_url, api_key)

    if args.product_id:
        old_product = client.get_product(args.product_id)
    else:
        matches = client.find_products_by_title(args.title)
        if not matches:
            raise SystemExit(f"No product matches title search {args.title!r}")
        if len(matches) > 1:
            titles = ", ".join(f"{p['title']!r} ({p['id']})" for p in matches)
            raise SystemExit(
                f"Multiple products match {args.title!r}, be more specific or use --product-id: {titles}"
            )
        old_product = matches[0]
    old_mbid = old_product["external_id"]
    print(f"Found existing product: {old_product['title']!r} ({old_product['id']}), mbid={old_mbid}")

    new_release = validate_new_mbid(args.new_mbid)
    print(f"New MBID resolves to: {new_release['title']!r}, released {new_release.get('date', '?')}, {new_release.get('country', '?')}")

    seed_row = update_seed_mbid(old_mbid, args.new_mbid)
    print(f"Updated seed.json row: rank #{seed_row['rank']} {seed_row['artist']} - {seed_row['title']}")

    channel_ids = (
        client.find_sales_channel_id("Default Sales Channel"),
        client.find_stock_location_id("The Vinyl Cut Warehouse"),
        client.find_shipping_profile_id(),
    )

    print("\nDry-running the corrected release...")
    outcome = process_row(client, seed_row, channel_ids, dry_run=True)
    print(f"  {outcome}")

    if not args.apply:
        print(f"\nPreview only. Re-run with --apply to delete {old_product['id']} and create the replacement.")
        return

    print(f"\nDeleting old product {old_product['id']}...")
    client.delete_product(old_product["id"])

    print("Creating the corrected product...")
    outcome = process_row(client, seed_row, channel_ids, dry_run=False)
    print(f"  {outcome}")

    new_product = client.find_product_by_external_id(args.new_mbid)
    print(f"\nDone: {new_product['title']!r} ({new_product['id']})")


if __name__ == "__main__":
    main()
