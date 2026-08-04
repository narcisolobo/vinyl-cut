"""One-off: pin curated_new_arrivals.json's picks to the top of "Latest
Arrivals", in the exact order curated, by hand-setting created_at.

Mirrors randomize_created_at.py's approach: created_at isn't settable
through the Admin API (UpdateProductDTO has no such field), so the
generated SQL has to be run directly against the `product` table. This
script only generates and previews it; it doesn't connect to the
database itself, for the same portability reason as
randomize_created_at.py.

Since it stamps created_at = now() (minus a small per-position step)
at run time, these 24 products land after every other product's
created_at, including any set by a prior randomize_created_at.py run
or by replace_release.py's per-fix product recreation earlier the same
session -- no need to touch the other ~476 rows.

Usage (from etl/):
    python tools/set_curated_new_arrivals_dates.py

Then review etl/seed/curated_new_arrivals.sql and apply it, e.g.:
    docker exec -i supabase_db_vinyl-cut psql -U postgres -d postgres \\
      -f - < etl/seed/curated_new_arrivals.sql

Config (etl/.env): same as randomize_created_at.py.
"""

import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

from load_catalog import MedusaAdminClient

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
CURATED_PATH = SEED_DIR / "curated_new_arrivals.json"
SQL_PATH = SEED_DIR / "curated_new_arrivals.sql"

STEP_MINUTES = 1.0


def main():
    load_dotenv()
    base_url = os.environ.get("MEDUSA_BASE_URL", "http://localhost:9000")
    api_key = os.environ.get("MEDUSA_ADMIN_API_KEY")
    if not api_key:
        raise SystemExit("MEDUSA_ADMIN_API_KEY env var is required (see etl/.env.example)")

    curated = json.loads(CURATED_PATH.read_text())
    curated.sort(key=lambda row: row["position"])

    client = MedusaAdminClient(base_url, api_key)

    lines = ["BEGIN;"]
    base_time = datetime.now(timezone.utc)
    print(f"Pinning {len(curated)} curated picks to the top of Latest Arrivals:\n")
    for row in curated:
        if not row.get("mbid"):
            raise SystemExit(f"position {row['position']} ({row['artist']} - {row['title']}) has no mbid yet")
        product = client.find_product_by_external_id(row["mbid"])
        if product is None:
            raise SystemExit(f"no product found for mbid {row['mbid']} ({row['artist']} - {row['title']})")
        created_at = base_time - timedelta(minutes=STEP_MINUTES * (row["position"] - 1))
        print(f"  #{row['position']:>2}  {row['artist']} - {row['title']}  ({created_at.isoformat()})")
        lines.append(f"UPDATE product SET created_at = '{created_at.isoformat()}' WHERE id = '{product['id']}';")
    lines.append("COMMIT;")

    SEED_DIR.mkdir(parents=True, exist_ok=True)
    SQL_PATH.write_text("\n".join(lines) + "\n")
    print(f"\nWrote {len(curated)} UPDATE statements to {SQL_PATH}")


if __name__ == "__main__":
    main()
