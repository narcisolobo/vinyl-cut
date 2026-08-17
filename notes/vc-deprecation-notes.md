# Known Deprecation Warnings

Tracked from `pnpm install` / `pnpm peers check` output on `@vc/backend`
(Medusa 2.18.0). All four trace to Medusa's own dependency tree or its
documented Jest pin — none are introduced by this project's own code, and
none currently require action. Logged here so this doesn't need
re-investigating from scratch next time the same warnings appear.

| Package | Traced source | Category |
| --- | --- | --- |
| `glob@7.2.3` | Jest 29's toolchain (`jest`, `jest-config`, `jest-runtime`, `jest-circus`, `jest-runner`, `babel-plugin-istanbul`/`test-exclude`), and `yalc` via `@medusajs/test-utils` | Testing tooling |
| `inflight@1.0.6` | Exclusively a dependency of the `glob@7.2.3` above | Testing tooling (transitive via glob) |
| `lodash.isequal@4.5.0` | `@medusajs/dashboard`, `@medusajs/ui` | Medusa admin UI |
| `uuid@9.0.1` | `bullmq`, via `@medusajs/event-bus-redis` and `@medusajs/workflow-engine-redis` | Runtime dependency (Redis event bus / workflow engine) |

## Notes

- Medusa's own packages elsewhere already resolve to current majors —
  `@medusajs/cli`/`@medusajs/framework`/`@medusajs/admin-bundler` use
  `glob@13.0.6`, and `@medusajs/medusa`/`@medusajs/telemetry` use
  `uuid@11.1.1` directly. The deprecated versions above are specifically
  from `bullmq`'s own pin and Jest 29's toolchain, not from Medusa's own
  code generally lagging.
- `test:unit`/`test:integration:*` require Jest specifically
  (`@medusajs/test-utils` is Jest-only — see the testing-strategy
  discussion in `vinyl_cut_prd.html`), so the Jest-sourced warnings aren't
  fixable by switching test runners.
- No project-level fix exists for any of these without an upstream Medusa
  release bumping its own `bullmq`, `test-utils`, or `dashboard`/`ui`
  dependency pins.

## Revisit

Re-check this list after any Medusa version bump (2.18.0 → newer) — worth
re-running `pnpm peers check` and diffing against this table to confirm
which, if any, have been resolved upstream.
