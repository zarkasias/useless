import { afterEach, describe, expect, it, vi } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("robots", () => {
  it("allows public crawling and excludes restricted routes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");

    expect(robots()).toEqual({
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
      sitemap: "https://example.com/sitemap.xml",
    });
  });

  it.each([undefined, ""])(
    "uses the production sitemap when the app URL is %s",
    (appUrl) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);

      expect(robots().sitemap).toBe(
        "https://www.uselessachievements.com/sitemap.xml",
      );
    },
  );
});

describe("sitemap", () => {
  it("includes public pages with their update metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com");
    vi.useFakeTimers();

    const now = new Date("2026-10-08T12:00:00.000Z");
    vi.setSystemTime(now);

    expect(sitemap()).toEqual([
      {
        url: "https://example.com",
        lastModified: now,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: "https://example.com/pro",
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
      },
      {
        url: "https://example.com/faq",
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: "https://example.com/privacy-policy",
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.2,
      },
      {
        url: "https://example.com/terms-of-service",
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.2,
      },
    ]);
  });

  it.each([undefined, ""])(
    "uses production URLs when the app URL is %s",
    (appUrl) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", appUrl);

      expect(sitemap().map((entry) => entry.url)).toEqual([
        "https://www.uselessachievements.com",
        "https://www.uselessachievements.com/pro",
        "https://www.uselessachievements.com/faq",
        "https://www.uselessachievements.com/privacy-policy",
        "https://www.uselessachievements.com/terms-of-service",
      ]);
    },
  );
});
