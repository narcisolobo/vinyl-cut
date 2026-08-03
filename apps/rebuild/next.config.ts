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
    // Product cover art is served straight from the Medusa backend
    // (`/static/...`) in local dev — no S3/CDN in front of it yet.
    // `unoptimized` is required, not just convenient: Next's image
    // optimizer refuses to fetch from any hostname that resolves to
    // a private/loopback IP (localhost does) as an SSRF guard, so
    // the built-in optimizer can never proxy these regardless of
    // `remotePatterns`. `apps/storefront` hits the same constraint.
    unoptimized: true,
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
    ],
  },
};

export default nextConfig;
