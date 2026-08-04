"""One-off: bias product created_at so "Latest Arrivals" doesn't visibly
mirror the Rolling Stone Top 500 rank the catalog was seeded from.

The catalog was loaded in strict RS-rank order (rank 1 first), so
created_at currently correlates *perfectly* with rank -- sorting the
store by "Latest Arrivals" shows the exact RS list, oldest-loaded (best)
albums last. This adds Gaussian noise to each product's rank before
re-deriving created_at from the noisy order, so the front page still
leans toward better-ranked albums (that's the point) without the
sequence being an obvious, exact match to a famous public list.

created_at isn't settable through the Admin API (UpdateProductDTO has
no such field -- Medusa's ORM manages it internally on create), so the
generated SQL has to be run directly against the `product` table. This
script only generates and previews it; it doesn't connect to the
database itself, to stay portable across local Docker Compose and any
future hosted deploy without adding a Postgres driver dependency here.

Usage (from etl/):
    python tools/randomize_created_at.py                     # full run
    python tools/randomize_created_at.py --stddev 150        # looser bias
    python tools/randomize_created_at.py --seed 1             # reproducible

Then review etl/seed/randomize_created_at.sql and apply it, e.g.:
    docker exec -i supabase_db_vinyl-cut psql -U postgres -d postgres \\
      -f - < etl/seed/randomize_created_at.sql

Config (etl/.env):
    MEDUSA_BASE_URL         default http://localhost:9000
    MEDUSA_ADMIN_API_KEY    a Medusa secret API key (see etl/.env.example)
"""

import argparse
import json
import os
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

from load_catalog import MedusaAdminClient

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"
SEED_PATH = SEED_DIR / "seed.json"
SQL_PATH = SEED_DIR / "randomize_created_at.sql"

PREVIEW_COUNT = 24


def load_rank_by_mbid() -> dict[str, int]:
    rows = json.loads(SEED_PATH.read_text())
    return {row["mbid"]: int(row["rank"]) for row in rows}


def main():
    parser = argparse.ArgumentParser(description="Generate SQL biasing product created_at toward RS rank, with noise.")
    parser.add_argument("--stddev", type=float, default=125.0, help="Gaussian noise stddev added to rank before sorting.")
    parser.add_argument("--step-minutes", type=float, default=1.0, help="Minutes between consecutive created_at values.")
    parser.add_argument("--seed", type=int, default=None, help="Random seed, for a reproducible run.")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    load_dotenv()
    base_url = os.environ.get("MEDUSA_BASE_URL", "http://localhost:9000")
    api_key = os.environ.get("MEDUSA_ADMIN_API_KEY")
    if not api_key:
        raise SystemExit("MEDUSA_ADMIN_API_KEY env var is required (see etl/.env.example to mint one)")

    rank_by_mbid = load_rank_by_mbid()

    client = MedusaAdminClient(base_url, api_key)
    products = client.list_all_products(fields="id,external_id,title")

    scored = []
    unmatched = []
    for product in products:
        rank = rank_by_mbid.get(product.get("external_id"))
        if rank is None:
            unmatched.append(product["id"])
            continue
        noisy_score = rank + random.gauss(0, args.stddev)
        scored.append((noisy_score, rank, product["id"], product["title"]))

    scored.sort(key=lambda row: row[0])  # lowest noisy score = most recent

    print(f"Matched {len(scored)} products to a seed rank; {len(unmatched)} unmatched (left untouched).")
    if unmatched:
        print(f"Unmatched product ids: {unmatched}")

    print(f"\nPreview -- resulting page 1 ({PREVIEW_COUNT} newest), with true RS rank:")
    for _, rank, _, title in scored[:PREVIEW_COUNT]:
        print(f"  #{rank:>3}  {title}")

    base_time = datetime.now(timezone.utc)
    lines = ["BEGIN;"]
    for position, (_, _, product_id, _) in enumerate(scored):
        created_at = base_time - timedelta(minutes=args.step_minutes * position)
        lines.append(f"UPDATE product SET created_at = '{created_at.isoformat()}' WHERE id = '{product_id}';")
    lines.append("COMMIT;")

    SEED_DIR.mkdir(parents=True, exist_ok=True)
    SQL_PATH.write_text("\n".join(lines) + "\n")
    print(f"\nWrote {len(scored)} UPDATE statements to {SQL_PATH}")


if __name__ == "__main__":
    main()
