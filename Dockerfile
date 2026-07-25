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
RUN pnpm install --filter=@dtc/backend --frozen-lockfile

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
WORKDIR /app/server
COPY --from=build /app/apps/backend/.medusa/server ./
RUN pnpm install --prod
EXPOSE 9000
CMD ["pnpm", "start"]
