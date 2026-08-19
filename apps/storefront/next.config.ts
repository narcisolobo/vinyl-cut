import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    viewTransition: true,
  },
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  images: {
    // Product cover art is served from local Supabase Storage
    // (`localhost:54321`) in dev. `unoptimized` is required, not
    // just convenient: Next's image optimizer refuses to fetch from
    // any hostname that resolves to a private/loopback IP — which
    // `localhost` always does, regardless of port — as an SSRF
    // guard, so the built-in optimizer can never proxy these
    // regardless of `remotePatterns`. Once deployed against a real
    // hosted Supabase project (a real public domain, not localhost),
    // this constraint goes away and `unoptimized` can come off.
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "54321" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ciso-codes",

  project: "vinyl-cut",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
