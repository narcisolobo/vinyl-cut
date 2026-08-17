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

export default nextConfig;
