import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/home/", "/workspace/", "/profile/", "/review/", "/notifications/", "/mobile/", "/create/", "/test/"],
    },
    sitemap: "https://idealite.xyz/sitemap.xml",
  };
}
