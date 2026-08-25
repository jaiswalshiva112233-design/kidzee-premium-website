import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return { name: "Kidzee CentreOS", short_name: "CentreOS", description: "Kidzee Sector 12 Dwarka centre operations", start_url: "/admin", display: "standalone", background_color: "#F4F6FB", theme_color: "#5B2A86", icons: [{ src: "/images/kidzee-logo.png", sizes: "any", type: "image/png" }] }; }
