import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kidzee Preschool & Daycare Sector 12 Dwarka",
    short_name: "Kidzee Dwarka",
    description: "Kidzee Sector 12 Dwarka centre operations and parent portal",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#5B2A86",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
