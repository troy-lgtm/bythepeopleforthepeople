import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/place/"],
      },
    ],
    sitemap: "https://bythepeopleforthepeople.com/sitemap.xml",
    host: "https://bythepeopleforthepeople.com",
  };
}
