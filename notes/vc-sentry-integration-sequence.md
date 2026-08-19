The Vinyl Cut: Sentry Integration Sequence

# The Vinyl Cut: Sentry Integration Sequence

A stepped plan for wiring Sentry error tracking into the storefront (`apps/storefront`, Next.js 16, pnpm workspace). Follow one step at a time — each step should be verifiably working before moving to the next.

---

## 1. Create the Sentry project

- Sign up / log in at sentry.io (free tier is plenty for a portfolio project).
- Create a new project, platform **Next.js**.
- Note the DSN it gives you — you'll need it in step 3.

## 2. Run the setup wizard

From `apps/storefront/`:

```
npx @sentry/wizard@latest -i nextjs
```

- Run it from inside the storefront package, not the monorepo root — it needs to find `next.config.ts` and the `src/app` directory.
- The wizard will ask to log in/authenticate with your Sentry account and pick the project from step 1.
- Let it modify `next.config.ts` and generate the instrumentation files (next).

## 3. Review what the wizard generated

Expect to see, roughly:

- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` (or a single `instrumentation.ts` wiring these up, depending on wizard version) — this project is on Next 16, so confirm which pattern the wizard used against `node_modules/next/dist/docs/` per this repo's Next.js rule (`apps/storefront/AGENTS.md`).
- `next.config.ts` wrapped with `withSentryConfig(...)`.
- A new `apps/storefront/src/app/global-error.tsx` (the wizard adds this — it's the boundary for errors in the root layout itself, which `error.tsx` can't catch).
- Env vars added to `.env.local` / `.env.sentry-build-plugin` — `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (for source map uploads at build time).

Read through each generated file before moving on — don't just trust the diff.

## 4. Wire the existing error.tsx into Sentry

`apps/storefront/src/app/error.tsx` currently just does `console.error(error)` in a `useEffect`. Replace that with `Sentry.captureException(error)`, matching whatever import path the wizard used in `global-error.tsx` for consistency.

## 5. Confirm .env handling fits the monorepo

- Check whether `SENTRY_AUTH_TOKEN` needs to live in `apps/storefront/.env.local` or the repo root, given the pnpm workspace layout.
- Make sure `.env.sentry-build-plugin` (or equivalent) is gitignored — it holds the auth token.

## 6. Test locally

- Add a temporary throw (e.g. a button that calls `throw new Error("test")`) somewhere reachable, or trigger a real error path.
- Confirm the error shows up in the Sentry dashboard within a minute or two.
- Remove the temporary throw once confirmed.

## 7. Configure for Render deployment

- Add `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` as environment variables in the Render service settings (not committed to the repo).
- Confirm the build step on Render has network access to upload source maps to Sentry (the wizard's build plugin does this during `next build`).

## 8. Verify in production

- After deploying to Render, trigger a real error (or the temporary test throw again) against the deployed URL.
- Confirm the event arrives in Sentry with correct source-mapped stack traces, not minified/obfuscated ones.
