// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import FAQPage from "@/app/faq/page";

let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(createElement(FAQPage));
});

describe("FAQPage", () => {
  it("renders the page heading and introduction", () => {
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent).toBe(
      "Frequently Asked Questions",
    );
    expect(container.textContent).toContain(
      "Everything you never knew you needed to know about useless achievements.",
    );
  });

  it("renders all 18 questions with unique headings and nonempty answers", () => {
    const sections = Array.from(container.querySelectorAll("section"));

    expect(sections).toHaveLength(18);

    const questions = sections.map((section) => {
      const question = section.querySelector("h2")?.textContent?.trim();
      const answer = section.querySelector("p")?.textContent?.trim();

      expect(question).toBeTruthy();
      expect(answer).toBeTruthy();

      return question;
    });

    expect(new Set(questions).size).toBe(18);
    expect(questions).toContain("What is Useless Achievements?");
    expect(questions).toContain("Can I share my achievements?");
    expect(questions).toContain("I found a bug. Did I unlock an achievement?");
  });

  it("provides an email contact and a link back home", () => {
    const email = container.querySelector(
      'a[href="mailto:info@uselessachievements.com"]',
    );
    const home = container.querySelector('a[href="/"]');

    expect(email?.textContent).toBe("info@uselessachievements.com");
    expect(home?.textContent).toBe("← Back to Home");
  });
});
