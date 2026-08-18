The Vinyl Cut - Product Requirements Document

# The Vinyl Cut: Product Requirements Document

**Project:** The Vinyl Cut (fictional record shop, demo project)

**Document status:** Draft v5

**Target stack:** Next.js, Medusa.js (native cart, checkout, and payment modules), Stripe (as Medusa payment provider), PostgreSQL

---

## 1\. Overview

The Vinyl Cut is a fictional record shop e-commerce site built to demonstrate a production-grade headless commerce architecture on Medusa.js. The store sells vinyl records across new-release and used/vintage inventory, with condition-graded pricing for used stock.

The centerpiece of the project is a custom restock-notification module built on top of Medusa — extending the framework with a new module and workflow rather than only configuring what ships by default.

## 2\. Goals

- Demonstrate a production-grade headless commerce architecture using Medusa's native module system rather than hand-rolled cart/payment logic.
- Showcase custom module and workflow development on top of Medusa (the restock-notify system), not just default configuration.
- Present a polished, idiomatic Next.js storefront with a distinct visual identity.
- Model realistic domain complexity specific to used-goods retail (condition grading, one-off inventory, restock notification) that a generic product catalog wouldn't surface.

## 3\. Non-Goals

- This is not a production store; no real payments, real customer data, or real inventory are involved. Stripe runs in test mode throughout.
- Full admin-side commerce operations (multi-warehouse fulfillment, returns/refunds workflows) are out of scope for this demo.
- Compliance-accurate tax handling (nexus determination, tax-exempt customers, third-party remittance providers) is out of scope; see Basic Tax Display under Core MVP for the limited scope that is included.
- Multi-vendor or marketplace functionality is out of scope.

---

## 4\. Data Sourcing

Catalog data is sourced from two paired, purpose-built services rather than manually collected or invented. Extraction, transformation, and loading are handled by a standalone Python ETL pipeline; see **vinyl\_cut\_etl\_pipeline.html** for the pipeline's structure, configuration, and logging/error-handling behavior.

- **Metadata:** MusicBrainz supplies real release data (artist, album title, release year, label, catalog number, tracklist) keyed by MusicBrainz ID (MBID).
- **Cover art:** the Cover Art Archive (a joint Internet Archive / MusicBrainz project) supplies cover images for a given release's MBID, available as 250px and 500px thumbnails for PLP and PDP use respectively. Images are downloaded once during catalog import and re-hosted on Supabase Storage (see File Storage under Infrastructure & Deployment) rather than hot-linked from coverartarchive.org at request time.
- **Back cover art:** fetched the same way as the front cover, at the same two thumbnail sizes, and added as a second image in the PDP artwork gallery when present. Unlike the front cover, a missing back cover is not a curation blocker — roughly 45% of the catalog (227 of the 500-release seed, verified live) has one available in the Cover Art Archive; the rest simply show a single-image gallery.
- **Genre:** not sourced from MusicBrainz's own tag data, which is user-submitted and inconsistent rather than a clean taxonomy. Genre is assigned from a small curated list at import time instead.
- **Attribution & risk note:** both services are widely used, well-known open data sources, but cover art remains copyrighted by its respective owners; this is a demonstration-purposes use accepted alongside the site's disclaimer banner, not a license grant. Downloading and re-hosting a copy is a small deliberate step up from hot-linking, still accepted under the same demonstration-purposes framing.
- **Implementation note:** the import script fetches each cover image from coverartarchive.org once (identifying itself with a descriptive User-Agent string per API etiquette), then uploads it through Medusa's File Module to Supabase Storage. Runtime requests are served from Supabase Storage, not from the Cover Art Archive, which also resolves the earlier no-caching-layer trade-off — there's no repeat third-party fetch to cache in the first place.

---

## 5\. Infrastructure & Deployment

Medusa's backend is a persistent Node process rather than a set of serverless functions, which shapes the hosting choices below.

- **Backend hosting:** Render, free tier. Render grants 750 free instance hours per workspace per month; free web services spin down after 15 minutes of inactivity with a 30-60 second cold start on the next request. A single always-on service uses roughly the whole monthly allowance, which is acceptable as long as it's the only free service in the workspace; a second Render account can be created later if another always-on free project is ever needed.
- **Database:** Supabase Postgres (not Render's managed Postgres). Use the direct connection string (port 5432) or the session-mode pooler, not the transaction-mode pooler, since Medusa's MikroORM-based migrations and prepared statements are incompatible with PgBouncer transaction pooling.
- **Redis:** Upstash, free tier. Speaks the standard Redis protocol over TCP, so Medusa's ioredis-based event bus and workflow engine work unchanged. Upstash is pay-per-request with no inactivity pause, so it requires no keep-alive handling.
- **File storage:** Medusa's File Module is configured with the S3 provider pointed at Supabase Storage (S3-compatible), rather than the default Local provider — the Local provider writes to disk, which is unsuitable given Render's ephemeral filesystem. Using Supabase Storage means no new vendor: it's the same Supabase project already used for Postgres. `forcePathStyle` must be set to `true` in the S3 provider config, since Supabase (like MinIO) doesn't support virtual-hosted-style URLs. All catalog cover art (front and back, where available) is downloaded once at import time and uploaded here (see Data Sourcing); the File Module isn't otherwise load-bearing for the catalog pipeline, only for any supplementary Admin-uploaded assets like a store logo or banner. The bucket is configured public-read, since cover art is non-sensitive, publicly cacheable catalog content and needs no signed URLs for the storefront to render it. Supabase's free tier caps storage at 1 GB total; for the initial 500-release catalog that's up to 1,000 front-cover thumbnails (500 releases × 2 sizes) plus up to 454 back-cover thumbnails (227 releases with one available, verified live, × 2 sizes), so catalog size should be sanity-checked against that budget before finalizing the seed list.
- **Keep-alive strategy:** two independent free-tier timers are in play — Render's 15-minute spin-down and Supabase's separate 7-day inactivity pause. A single UptimeRobot HTTP monitor (free tier, 5-minute interval) hits a dedicated `/health` endpoint on the Medusa backend that performs a trivial database query (not just a 200 response), which resets both timers in one request. This is a workaround, not a fix: a genuine restart (deploy, Render maintenance) still incurs a real cold start regardless of pinging.

### Local development

- Medusa runs locally as its own service in `docker-compose.yml`, using the same Dockerfile that deploys to Render, alongside local Postgres and Redis services. This keeps local development in the same containerized environment that ships to production, rather than drawing an inconsistent line between "Postgres/Redis are containerized for parity, but Medusa isn't."
- The Medusa service bind-mounts the local source directory into the container and runs the dev command (hot-reload) rather than a production start command, so edits on the host filesystem are picked up immediately without rebuilding the image.
- **Postgres:** the Supabase CLI's local stack (`supabase start`) is used instead of a bare `postgres` container, since it matches the hosted project's Postgres version, extensions, and connection pooler (Supavisor). A vanilla Postgres image would miss the pooler entirely, which is the same PgBouncer transaction-mode issue flagged above — it would pass locally and only fail after deployment.
- **Redis:** a plain `redis` Docker image is used locally. Upstash speaks the standard Redis protocol with no pooling layer, so there's no parity gap to account for on this side.
- Local `.env` points the Medusa container at the local Supabase Postgres connection string and local Redis container; no dependency on the hosted Render/Supabase/Upstash services during development.
- **Apple Silicon note:** since local development runs on an M2 MacBook Air (arm64), Docker Desktop runs Linux containers natively via its VM, so there's no architecture concern locally. The only place architecture would matter is if a locally-built image were pushed directly to a registry for Render to pull; the deployment approach instead has Render build the image itself from the Dockerfile on its own (amd64) infrastructure, which avoids that mismatch entirely.

### Docker deployment

- Render fully supports Docker-based deploys, either building an image from a Dockerfile in the repo or pulling a prebuilt image from a registry.
- Render does not run a multi-container `docker-compose.yml` as a single deployment; each service normally needs to be defined separately (typically via a `render.yaml` Blueprint). This isn't a blocker here, since Postgres and Redis are hosted on Supabase and Upstash rather than on Render — the only container actually deployed to Render is Medusa itself.
- The same Dockerfile is used in both places: locally it's built with a bind mount and a dev command for hot-reload; on Render, it's built fresh from the repo using a production start command, pointed at the hosted Supabase and Upstash connection strings via environment variables. Render builds the image on its own infrastructure, so local architecture (Apple Silicon) has no bearing on the deployed image.

---

## 6\. Core MVP Features (Must-Haves)

Baseline functionality required for a complete, end-to-end shopping experience and general full-stack showcase.

### Storefront & catalog (Next.js)

- **Product listing page (PLP):** Grid display of records with cover art, album title, artist name, and an inline condition selector (e.g., Mint, Very Good+) — price updates to match the selected condition without leaving the grid.
- **Multi-attribute filtering & sorting:** Filter by genre, era/decade, and media condition; sort by price, date added, and artist name.
- **Product detail page (PDP):**
  - High-resolution album artwork gallery.
  - Metadata display (label, release year, press type, catalog number, tracklist).
  - **Variant selector:** choose record condition (e.g., Mint, Very Good+) with real-time price and stock updates.
  - Interactive "add to cart" CTA.

### Cart & checkout (Medusa native modules)

- **Persistent cart:** Medusa's cart module, accessible from any route, showing subtotal, item quantities, and removal controls.
- **Inventory validation:** Medusa's inventory module prevents adding more units than currently available in stock. For one-off used variants (quantity of 1), a race between two customers checking out the same item simultaneously is resolved by Medusa's default inventory reservation TTL rather than custom locking logic.
- **Checkout & payment:** Medusa's checkout flow with Stripe configured as the payment provider, supporting test card numbers.
- **Order confirmation page:** post-purchase route displaying order ID, purchased items summary, shipping address, shipping cost, and payment status.
- **Order confirmation email:** transactional confirmation email sent via Resend upon successful checkout, matching the on-site confirmation page. Promoted from Nice-to-Have to Core MVP since Resend is already required for the restock-notify system, making this a near-zero-cost addition to a complete checkout experience.
- **Basic tax display:** Medusa's native tax module configured with flat rates for CA, OR, WA, NV, AZ, CO, UT, and NM (the shop's shipping region), shown as a line item at checkout. Not compliance-accurate; demonstrates module configuration only.
- **Shipping cost:** a single flat rate applied across the entire Western U.S. shipping region, consistent with the flat-rate approach already used for tax. No carrier-calculated or distance-based shipping.
- **Shipping region restriction:** checkout only accepts shipping addresses within CA, OR, WA, NV, AZ, CO, UT, and NM. Framed in-store as a Western U.S.-only shipping policy (shorter transit times, lower breakage risk for a small independent shop).

### Commerce engine & data (Medusa.js + PostgreSQL)

- **Product & inventory schema:** structured models for products, variants (conditions), categories, and inventory counts.
- **Medusa Admin dashboard:** administrative interface to add/edit products, manage stock levels, and view/fulfill orders. Reachable at a public Render URL, but access is gated by Medusa's built-in Auth Module admin login (email/password) rather than left open — no additional access-control layer is being added on top of what Medusa already provides.
- **Payment event handling:** Medusa's payment module handles provider webhook events and order-status transitions natively; no custom webhook endpoint required.
- **Custom Store API route:** a `/store/product-options` route exposes store-wide (non-exclusive) product options and their values — e.g., the shared "Condition" option every variant uses — since Medusa's default Store API only ever returns options nested under a specific product, with no route to list a catalog-wide option's values directly. Needed for the storefront's condition filter to resolve filter selections to option-value IDs.

### General UI & branding

- **Demo disclaimer banner:** header/footer notice indicating the site is a non-commercial demo running in Stripe test mode.
- **Shipping policy note:** brief storefront copy (footer or shipping/FAQ page) explaining the Western U.S.-only shipping policy.
- **Responsive layout:** layout adaptation across mobile, tablet, and desktop viewports.

---

## 7\. Flagship Differentiator

This is the feature the project is built to showcase — a custom Medusa module rather than default configuration. It is not required for the store to function, but it is the centerpiece of the build.

### Restock / pre-order notify system

- Custom Medusa module (`RestockSubscription`) tracking "notify me" requests against out-of-stock, one-off used variants.
- A daily cron job checks variant availability and triggers a workflow that resolves pending subscriptions for any variant that's come back in stock.
- Transactional email sent to subscribed customers when a watched variant is restocked.
- Demonstrates designing a custom module and workflow on top of Medusa, rather than only configuring what ships out of the box.

#### Restock semantics

A genuinely one-off item (a specific physical disc) can never literally restock once sold. A variant is modeled as a SKU-level bucket — e.g. "Kind of Blue — VG+" — not a literal single item. "Restock" means a different physical copy of the same release, in the same condition grade, is received and incremented against that same variant's inventory count. This is the same modeling approach used by used-goods marketplaces generally, not a workaround specific to this project.

#### Flow

- No account or login required — a customer submits only an email address on an out-of-stock variant's "Notify Me" form.
- Backend creates a `RestockSubscription` record: email, variant ID, sales channel ID, and (when available) customer ID. Subscribing is a single step — no verification email, no status field, no expiry/pruning window. A unique index on `(email, variant_id)` prevents duplicate rows from a normal user resubmitting the same request.
- A daily cron job (`check-restock`, running at midnight) checks availability across watched variants. For any variant that's come back in stock, it triggers a workflow that queries subscriptions for that variant, sends the restock email via Resend, and resolves them.
- If Customer Account Auth ships as well, a logged-in customer's email can pre-fill the notify form, but the notify system does not depend on auth to function.

#### Design note

An earlier draft of this document called for a double opt-in (a hashed, single-use verification token behind a magic-link email) and a workflow triggered directly off inventory-update events, with the request's unique index scoped to active statuses only. Both were simplified during implementation: a daily cron poll turned out simpler to reason about than a bespoke inventory-update listener, and dropping verification removes a whole status/expiry state machine that a non-production demo doesn't need. This simpler design is the accepted, final implementation — this section describes it, not the original spec.

#### Explicit scope decision

- Abuse prevention (rate-limiting repeated submissions, capping pending requests per email) is intentionally out of scope. This is a legitimate production concern but not one this demo needs to demonstrate.

---

## 8\. Nice-to-Have Features (Enhancements)

Additions that demonstrate specialized domain features and a polished user experience, without expanding core MVP scope.

### Vinyl-specific features

- **Spinning record animation:** CSS/JS interactive animation where vinyl slides out of the sleeve and spins on hover/play.
- **Goldmine grading scale guide:** interactive modal or tooltip explaining vinyl condition grades (M, NM, VG+, VG, G).

### Discovery & engagement

- **Instant search bar:** client-side search interface for immediate artist and title matching.
- **Recommended items:** "you might also like" product carousel based on shared genres or artists.
- **Wishlist system:** database-backed item saving functionality.

### Customer experience & automation

- **Customer account auth:** user registration, login, saved shipping addresses, and order history tracking.
- **Discount code system:** promotional code input during cart/checkout.

---

## 9\. Non-Functional Requirements

- Storefront pages should meet reasonable performance and accessibility baselines (responsive contrast, keyboard-navigable filters and cart).
- Backend and storefront are deployed independently: Medusa backend on Render (free tier, persistent Node process), Postgres on Supabase, Redis on Upstash. See Infrastructure & Deployment for keep-alive handling.
- Catalog content (artists, albums, cover art) is real, sourced via MusicBrainz and the Cover Art Archive; the disclaimer banner explicitly notes demonstration-only use with no commercial affiliation.
- **Testing strategy:** scoped rather than comprehensive, given the Goals section's "production-grade" claim needs some backing without requiring full coverage for a demo project. In scope: backend unit tests for isolated, dependency-free logic and integration tests for checkout and the restock-notify workflow specifically, since that's the flagship feature — see **medusa-unit-tests.md** and **medusa-integration-tests.md** for the current suggested lists — plus end-to-end tests covering the storefront's key user journeys (catalog browsing/filtering, PDP, cart, guest checkout, shipping-region restriction, restock-notify signup) via Playwright, building on the existing `apps/storefront/e2e/` smoke test — see **e2e-tests.md** for that spec list. Full UI coverage (every viewport, every edge case) is still out of scope; the e2e suite targets the golden path per journey, not exhaustive coverage.

## 10\. Phased Roadmap

- **Phase 1: Local Medusa setup** — Docker Compose for local Postgres (via Supabase CLI) and Redis; bootstrap the local Medusa instance (admin user, region, sales channel, stock location, shipping profile — see Bootstrap Prerequisites in vinyl\_cut\_etl\_pipeline.html); run the catalog ETL pipeline against it to import catalog data and cover art, all running locally.
- **Phase 2: Next.js catalog** — build product listing, filtering, and product detail pages against the local Medusa instance.
- **Phase 3: Cart & checkout** — wire up Medusa's cart module and Stripe-backed checkout flow (test mode), locally; add unit tests for pricing/tax/shipping helpers and integration tests for checkout.
- **Phase 4: Restock-notify module** — build the custom Medusa module and workflow, wire to transactional email, locally; add integration tests for the notify/verify/restock workflow.
- **Phase 5: Deployment** — provision Render, Supabase, and Upstash; deploy the Medusa Dockerfile to Render; point Redis at Upstash; bootstrap the deployed Medusa instance the same way as local (admin user, region, sales channel, stock location, shipping profile); re-run the catalog ETL pipeline (see vinyl\_cut\_etl\_pipeline.html) against it to seed the hosted database; set up the UptimeRobot health-check monitor; deploy the Next.js storefront.
- **Phase 6: Polish & flex** — footer disclaimer, spinning record animation, grading-scale guide, responsive tweaks, SEO metadata, OG image, thumbnail.

## 11\. Appendix: Vinyl Condition Grading Reference

- **M (Mint):** perfect, unplayed condition.
- **NM (Near Mint):** minimal signs of handling, no noticeable wear.
- **VG+ (Very Good Plus):** light wear, plays with minimal surface noise.
- **VG (Very Good):** noticeable wear, audible but not distracting surface noise.
- **G (Good):** significant wear, playable with clear surface noise.
