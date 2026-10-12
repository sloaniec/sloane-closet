import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sloane's Closet",
    short_name: "Sloane's Closet",
    description: "Save clothes from any store, see them on you, and shop.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8ee",
    theme_color: "#e3f4ee",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
