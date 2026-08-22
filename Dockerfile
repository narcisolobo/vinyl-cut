# syntax=docker/dockerfile:1.7
# Builds the Medusa backend (apps/backend). This is the only service
# containerized for deployment (Render); Postgres and Redis are hosted
# separately (Supabase, Upstash) in production and run outside this
# Dockerfile locally too (Supabase CLI, plain redis image).

FROM node:24.18.0-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# ---- deps: install full workspace deps (dev + prod) for the backend app ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --filter=@vc/backend --frozen-lockfile

# ---- dev: local docker-compose target; source is bind-mounted over this ----
FROM deps AS dev
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
EXPOSE 9000
CMD ["pnpm", "dev"]

# ---- build: compile the production server bundle ----
FROM deps AS build
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
RUN pnpm build

# ---- production: standalone .medusa/server output, prod deps only (Render) ----
FROM base AS production
ENV NODE_ENV=production
# Hosted Supabase's DATABASE_URL hostname resolves both A and AAAA records,
# same as host.docker.internal in docker-compose.yml's dev target -- Node
# tries the IPv6 route first and it isn't routable here, hanging until
# ENETUNREACH. Same fix as that Compose environment override, baked into
# the image itself since this needs to hold on Render too, not just locally.
ENV NODE_OPTIONS=--dns-result-order=ipv4first
WORKDIR /app/server
COPY --from=build /app/apps/backend/.medusa/server ./
# Medusa's standalone build output has no pnpm-workspace.yaml of its own, so
# without this pnpm silently skips native-module install scripts here (same
# packages the root pnpm-workspace.yaml's allowBuilds already allows for the
# monorepo install) -- esbuild/sharp/etc. end up unbuilt and the app fails
# at runtime. Recreate the same allowlist for this standalone install.
COPY <<EOF pnpm-workspace.yaml
allowBuilds:
  '@medusajs/telemetry': true
  '@sentry/cli': true
  '@swc/core': true
  esbuild: true
  msgpackr-extract: true
  protobufjs: true
  sharp: true
  unrs-resolver: true
EOF
RUN pnpm install --prod
EXPOSE 9000
CMD ["pnpm", "start"]
