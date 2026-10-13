import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bayloop",
    short_name: "Bayloop",
    description: "Workshop management system",
    start_url: "/tech",
    display: "standalone",
    background_color: "#F4F5F5",
    theme_color: "#2F7A73",
    icons: [
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
