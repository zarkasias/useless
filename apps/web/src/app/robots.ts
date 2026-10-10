import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.uselessachievements.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/collection",
        "/leaderboard",
        "/packs",
        "/login",
        "/signup",
        "/auth",
        "/api",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
