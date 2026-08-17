The Vinyl Cut - Catalog ETL Pipeline

# The Vinyl Cut: Catalog ETL Pipeline

**Companion to:** vinyl\_cut\_prd.html, Data Sourcing and Phase 1

**Document status:** Draft v2

**Language/runtime:** Python (independent of the Next.js/Medusa app runtime)

---

## 1\. Overview

A standalone Python ETL script populates The Vinyl Cut's catalog. It pulls release metadata from MusicBrainz and cover art from the Cover Art Archive, fabricates the retail data neither source provides (condition variants, price, quantity), and loads everything into Medusa through its Admin REST API. The pipeline is safely re-runnable and can target either a local or deployed Medusa instance via configuration.

## 2\. Pipeline Structure

### Bootstrap (prerequisite, one-time per environment)

- The pipeline seeds catalog data — it does not provision store configuration. Before the first run against a given environment (local or hosted), an admin user must already exist (created via `npx medusa user -e ... -p ...`) so an Admin API key can be issued for the pipeline to authenticate with.
- A default region (matching the PRD's eight-state shipping list), sales channel, stock location, and shipping profile must also already exist, since Medusa products aren't purchasable through checkout without them. These are created once per environment, manually through Medusa Admin; the pipeline assumes they're already in place rather than provisioning them itself.

### Extract

- A curated seed file (JSON or CSV) drives the run — one row per release, identified by an explicit MusicBrainz release ID (MBID). Artist + album title resolution is a curation-time aid only, used once by hand to look up the correct MBID for a given pressing — never resolved automatically at pipeline runtime, since MusicBrainz search can return multiple candidate releases (different pressings, reissues, regional editions) for the same title, and silently picking one risks loading the wrong pressing's metadata and tracklist.
- MusicBrainz metadata is queried via `musicbrainzngs`, which handles MusicBrainz's required rate limit (1 request/second) and User-Agent header.
- Cover art is fetched from the Cover Art Archive via `requests`, throttled client-side to the same 1 request/second etiquette applied to MusicBrainz — `musicbrainzngs` only covers MusicBrainz calls, so this throttle is applied manually for CAA. Both the 250px and 500px front-cover thumbnail endpoints (`/release/{mbid}/front-250`, `/release/{mbid}/front-500`) are fetched as two separate requests, matching the PLP/PDP thumbnail sizes from the PRD's Data Sourcing section.
- Releases with no Cover Art Archive entry are excluded from the seed file at curation time, not handled at runtime — the PDP's artwork gallery is a core showcase, so the catalog is curated to only include releases with real cover art. If a CAA 404 slips through anyway, it's logged as a non-retryable skip: not a failure, and never backfilled with a placeholder image.
- **Back cover (best-effort):** the release's CAA metadata endpoint (`/release/{mbid}`) is checked for an image flagged `back: true`; when present, its 250px and 500px thumbnails are fetched the same way as the front cover and added as a second gallery image. Unlike the front cover, a missing back cover is not a curation blocker — roughly 58% of releases have one (based on the initial 500-release seed) and the rest simply get a single-image gallery. This check is a separate CAA metadata call per release, so it adds to the same 1 request/second budget as the front-cover fetch.

### Transform

- Maps MusicBrainz metadata into Medusa's product shape: title, description (built from label/year/tracklist), handle/slug generation.
- Assigns genre from a curated lookup table keyed by MBID or artist, not from MusicBrainz's own tag data.
- Generates 1-3 condition variants per release (e.g., New, VG+, G) with fabricated price and quantity, since neither external source supplies retail data.
- Deliberately zeroes out quantity on a handful of used variants, so the restock-notify flow has something to demo against immediately after seeding.

### Load

- Pushes transformed records to Medusa via its Admin REST API (no official Python SDK exists for Medusa; it's a JS/TS-first framework), authenticated with an Admin API key.
- Cover art is uploaded through Medusa's File Module upload endpoint, not written directly to Supabase Storage — this keeps the storage abstraction consistent with how Medusa itself manages files. Both thumbnail sizes are uploaded as separate file assets and their URLs stored on the product. When a back cover was found at the extract stage, it's uploaded the same way and appended as a second image in the product's gallery, ordered after the front cover.
- **Load ordering:** cover art is uploaded and the variant payload fully assembled _before_ the product-creation call; the product itself — with variants and image references attached — is created in a single final call. This means a product only exists in Medusa once a record is fully loaded, so a failure partway through a record never leaves a half-created product behind for the idempotency check below to mistake as "done."
- **Idempotency:** each created product stores its MusicBrainz release ID as external metadata; the load stage checks for an existing product with that ID before creating a duplicate. On re-run, existing products have their static catalog metadata (title, description, genre, images, tracklist) upserted from the seed file, so corrections propagate on reseed. Commerce-sensitive fields — price and quantity — are set only at first creation and never overwritten on re-run, since by the time a hosted store is reseeded, real orders and restock-notify activity may already have changed them.

---

## 3\. Logging & Error Handling

- **Per-record isolation:** a failure on any single seed-file row (e.g., MusicBrainz 404, missing cover art, malformed seed data) is caught, logged, and skipped — it does not halt the batch.
- **Structured run log:** each run produces a log covering, per record: MBID, resolved title/artist, stage reached (extract/transform/load), and outcome (created, skipped-duplicate, failed).
- **End-of-run summary:** counts of created, skipped, and failed records, printed to stdout and written to the log file.
- **Failure detail:** failed records log the specific exception/HTTP status and the seed-file row that caused it, so a failure can be diagnosed and re-run individually without re-running the full batch.
- **Retryable vs. non-retryable errors:** transient errors (network timeouts, MusicBrainz/CAA rate-limit responses) get a small retry with backoff; non-transient errors (404 on a bad MBID, malformed seed row) fail immediately and are logged for manual correction of the seed file. CAA's metadata endpoint occasionally redirects to `archive.org` directly for older items rather than serving from coverartarchive.org itself, and archive.org has been observed to connection-timeout independently of CAA's own health — this is a transient case and gets the same retry-with-backoff treatment, not treated as a missing-art 404.
- **Medusa Admin API failures:** a failure at the load stage (e.g., Medusa unreachable, validation error on product creation) is logged with the request payload that failed, distinct from extract/transform failures, since it points at a different part of the system to debug.

## 4\. Configuration

- Target Medusa instance (local or deployed) and Admin API key are supplied via environment variables, not hardcoded, so the same script seeds local dev in Phase 1 and can reseed the hosted store after deployment without modification.
- Lives in an `etl/` subdirectory of the repo, separate from both the Medusa backend and the Next.js storefront.

## 5\. Usage

- Run against local Medusa during Phase 1 to seed initial catalog data.
- Re-run against the deployed Medusa instance after Phase 5 to seed the hosted store, or to refresh catalog metadata (e.g. corrected seed data) on an already-seeded store — the idempotency check avoids duplicate products, and only static metadata fields are updated on re-run, not price or quantity (see Load).
