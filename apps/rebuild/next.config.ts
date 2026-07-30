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
};

export default nextConfig;
