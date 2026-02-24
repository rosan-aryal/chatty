import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/chat/", "/api/", "/onboarding"],
      },
    ],
    sitemap: "https://chattyy.vercel.app/sitemap.xml",
  };
}
