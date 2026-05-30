import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LazyCodex",
    short_name: "LazyCodex",
    description: "Codex for no-brainers. Just prompt with ultrawork.",
    start_url: "/",
    display: "standalone",
    background_color: "#14154d",
    theme_color: "#2a2dbf",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
