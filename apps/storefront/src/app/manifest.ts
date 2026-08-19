import type { MetadataRoute } from "next";

function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Vinyl Cut",
    short_name: "The Vinyl Cut",
    description:
      "New pressings, rare finds, and records worth digging for — install for quick access to the crates.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0c1425",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

export default manifest;
