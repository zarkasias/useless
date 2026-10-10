// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PrivacyPolicy from "@/app/privacy-policy/page";
import TermsOfService from "@/app/terms-of-service/page";

function render(Page: typeof PrivacyPolicy) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(createElement(Page));
  return container;
}

describe.each([
  {
    name: "Privacy Policy",
    Page: PrivacyPolicy,
    sectionCount: 13,
  },
  {
    name: "Terms of Service",
    Page: TermsOfService,
    sectionCount: 22,
  },
])("$name", ({ name, Page, sectionCount }) => {
  it("renders the heading and effective date", () => {
    const container = render(Page);

    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent).toBe(name);
    expect(container.textContent).toContain("Effective September 7, 2026");
  });

  it("renders numbered sections with headings and content", () => {
    const container = render(Page);
    const sections = Array.from(container.querySelectorAll("section"));

    expect(sections).toHaveLength(sectionCount);

    sections.forEach((section, index) => {
      const heading = section.querySelector("h2")?.textContent?.trim();

      expect(heading).toMatch(new RegExp(`^${index + 1}\\. `));
      expect(section.querySelector("p")?.textContent?.trim()).toBeTruthy();
    });

    expect(sections.at(-1)?.querySelector("h2")?.textContent).toBe(
      `${sectionCount}. Contact Us`,
    );
  });

  it("provides contact and home links", () => {
    const container = render(Page);

    expect(
      container.querySelector('a[href="mailto:info@uselessachievements.com"]')
        ?.textContent,
    ).toBe("info@uselessachievements.com");

    expect(container.querySelector('a[href="/"]')?.textContent).toBe(
      "← Back to Home",
    );
  });
});

describe("Privacy Policy resources", () => {
  it("links to Google's privacy information and analytics opt-out tool", () => {
    const container = render(PrivacyPolicy);

    for (const href of [
      "https://policies.google.com/technologies/partner-sites",
      "https://tools.google.com/dlpage/gaoptout",
    ]) {
      const link = container.querySelector(`a[href="${href}"]`);

      expect(link).not.toBeNull();
      expect(link?.getAttribute("target")).toBe("_blank");

      const rel = link?.getAttribute("rel")?.split(/\s+/) ?? [];
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });
});
