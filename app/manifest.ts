import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prenota",
    short_name: "Prenota",
    description: "Prenota e gestisci appuntamenti in modo semplice.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f8",
    theme_color: "#111111",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
