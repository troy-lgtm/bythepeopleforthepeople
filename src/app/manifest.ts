import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "By The People, For The People",
    short_name: "BTPFTP",
    description:
      "Source-anchored public-decision intelligence. Nonpartisan civic records, indexed.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf7",
    theme_color: "#07111f",
    categories: ["news", "education", "productivity", "government"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Ask a record",
        short_name: "Explore",
        description: "Search 550+ source-anchored civic records.",
        url: "/explore",
      },
      {
        name: "Your reps",
        short_name: "Reps",
        description: "See your federal representatives.",
        url: "/federal",
      },
      {
        name: "Topics",
        short_name: "Topics",
        description: "Fires, homelessness, crime.",
        url: "/topics/fires",
      },
    ],
  };
}
