// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/globals.css", () => ({}));

const mocks = vi.hoisted(() => ({
  script: vi.fn(),
  toaster: vi.fn(),
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "test-font-sans",
  }),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) =>
    createElement("img", {
      src,
      alt,
      width,
      height,
      className,
    }),
}));

vi.mock("next/script", () => ({
  default: (props: unknown) => {
    mocks.script(props);
    return null;
  },
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: (props: unknown) => {
    mocks.toaster(props);
    return createElement("div", { "data-testid": "toaster" });
  },
}));

vi.mock("@/components/GoogleAnalytics", () => ({
  default: () => createElement("div", { "data-testid": "google-analytics" }),
}));

vi.mock("@/components/auth/idle-session-manager", () => ({
  IdleSessionManager: () =>
    createElement("div", { "data-testid": "idle-session-manager" }),
}));

import RootLayout, { metadata } from "@/app/layout";

type ScriptProps = {
  id?: string;
  src?: string;
  type?: string;
  strategy?: string;
  async?: boolean;
  crossOrigin?: string;
  dangerouslySetInnerHTML?: { __html: string };
};

let page: Document;

function scriptById(id: string): ScriptProps {
  const props = mocks.script.mock.calls
    .map(([value]) => value as ScriptProps)
    .find((value) => value.id === id);

  if (!props) throw new Error(`Missing script: ${id}`);
  return props;
}

beforeEach(async () => {
  mocks.script.mockReset();
  mocks.toaster.mockReset();

  const layout = await RootLayout({
    children: createElement(
      "section",
      { "data-testid": "page-content" },
      "Page content",
    ),
  });

  page = new DOMParser().parseFromString(
    renderToStaticMarkup(layout),
    "text/html",
  );
});

describe("RootLayout", () => {
  it("renders the document shell, viewport, font, and page content", () => {
    expect(page.documentElement.lang).toBe("en");
    expect(
      page.querySelector('meta[name="viewport"]')?.getAttribute("content"),
    ).toBe("width=device-width, initial-scale=1, maximum-scale=5");
    expect(page.body.classList.contains("test-font-sans")).toBe(true);
    expect(
      page.querySelector('main > [data-testid="page-content"]')?.textContent,
    ).toBe("Page content");
  });

  it("provides footer navigation and the current copyright year", () => {
    const footer = page.querySelector("footer");
    const navigation = footer?.querySelector(
      'nav[aria-label="Footer navigation"]',
    );

    for (const [href, label] of [
      ["/faq", "FAQ"],
      ["/privacy-policy", "Privacy Policy"],
      ["/terms-of-service", "Terms of Service"],
    ]) {
      expect(navigation?.querySelector(`a[href="${href}"]`)?.textContent).toBe(
        label,
      );
    }

    expect(footer?.textContent).toContain(
      `© ${new Date().getFullYear()} Useless Achievements.`,
    );
  });

  it("renders featured badges and the Instagram link with safe external targets", () => {
    expect(
      page.querySelector('img[alt="Useless Achievements on Product Hunt"]'),
    ).not.toBeNull();
    expect(
      page.querySelector('img[alt="Useless Achievements on VibeRank"]'),
    ).not.toBeNull();
    expect(
      page.querySelector(
        'nav[aria-label="Social media"] a[href="https://www.instagram.com/uselessachievements/"]',
      ),
    ).not.toBeNull();

    const externalLinks = Array.from(
      page.querySelectorAll('footer a[target="_blank"]'),
    );

    expect(externalLinks).toHaveLength(3);

    for (const link of externalLinks) {
      const rel = link.getAttribute("rel")?.split(/\s+/) ?? [];
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });

  it("includes session management, analytics, and configured toast notifications", () => {
    expect(
      page.querySelector('[data-testid="idle-session-manager"]'),
    ).not.toBeNull();
    expect(
      page.querySelector('[data-testid="google-analytics"]'),
    ).not.toBeNull();
    expect(page.querySelector('[data-testid="toaster"]')).not.toBeNull();

    expect(mocks.toaster).toHaveBeenCalledExactlyOnceWith({
      position: "top-right",
      expand: true,
      richColors: true,
    });
  });

  it("configures the asynchronous AdSense script", () => {
    expect(scriptById("google-adsense")).toEqual(
      expect.objectContaining({
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5732734926517492",
        async: true,
        crossOrigin: "anonymous",
        strategy: "afterInteractive",
      }),
    );
  });

  it("provides valid structured data describing the free web application", () => {
    const script = scriptById("structured-data");

    expect(script.type).toBe("application/ld+json");

    const json = script.dangerouslySetInnerHTML?.__html;
    expect(json).toEqual(expect.any(String));

    expect(JSON.parse(json!)).toEqual(
      expect.objectContaining({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Useless Achievements",
        url: "https://uselessachievements.com",
        applicationCategory: "Entertainment",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      }),
    );
  });

  it("exports the site's canonical metadata and social preview configuration", () => {
    expect(metadata.metadataBase?.toString()).toBe(
      "https://www.uselessachievements.com/",
    );
    expect(metadata.title).toEqual({
      default:
        "Useless Achievements - Collect Ridiculously Pointless Achievements",
      template: "%s | Useless Achievements",
    });
    expect(metadata.manifest).toBe("/manifest.json");
    expect(metadata.alternates?.canonical).toBe(
      "https://www.uselessachievements.com",
    );
    expect(metadata.robots).toEqual(
      expect.objectContaining({ index: true, follow: true }),
    );
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        type: "website",
        siteName: "Useless Achievements",
        images: expect.arrayContaining([
          expect.objectContaining({
            url: "/og-image.png",
            width: 1200,
            height: 630,
          }),
        ]),
      }),
    );
    expect(metadata.twitter).toEqual(
      expect.objectContaining({ card: "summary_large_image" }),
    );
  });
});
