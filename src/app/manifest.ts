import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "lockin. — study smarter for UTU B.Tech",
    short_name: "lockin.",
    description: "The whole first-year UTU syllabus, unit by unit, with practice, live labs and an AI tutor.",
    start_url: "/home",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1a20",
    theme_color: "#44c95a",
    categories: ["education"],
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Formula cards", url: "/formulas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "PYQ bank", url: "/pyq", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
