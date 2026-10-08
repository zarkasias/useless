import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("manifest", () => {
  it("identifes the application", () => {
    expect(manifest()).toMatchObject({
      name: "Useless Achievements",
      short_name: "Useless Achievements",
      description: "Unlock and share hilariously useless achievements!",
    });
  });

  it("launches at home in standalone mode with the configured colors", () => {
    expect(manifest()).toMatchObject({
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#38bdf8",
    });
  });

  it("provides favicon and installation icons, including a maskable icon", () => {
    expect(manifest().icons).toEqual([
      {
        src: "/favicons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/favicons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/favicons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });
});
