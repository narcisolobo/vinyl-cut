import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Outside Next's build, "server-only" resolves to its default export
      // condition, which unconditionally throws. Next swaps in the no-op
      // "react-server" condition at build time; Vitest doesn't, so alias it
      // directly to the no-op the "react-server" condition would use.
      "server-only": path.resolve(dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    // Default include also matches "*.spec.ts", which collides with
    // Playwright's e2e/*.spec.ts — scope to our unit test convention.
    include: ["src/**/*.test.ts"],
  },
});
