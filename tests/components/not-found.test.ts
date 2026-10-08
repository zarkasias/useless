// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import NotFound from "@/app/not-found";

function render(): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(createElement(NotFound));
  return container;
}

describe("NotFound", () => {
  it("explains that the requested page does not exist", () => {
    const container = render();

    expect(container.querySelector("main")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe(
      "404 Achievement Unlocked",
    );
    expect(container.querySelector("p")?.textContent).toBe(
      "You successfully found a page that does not exist. Truly impressive.",
    );
  });

  it("provides descriptive alternative text for the trophy", () => {
    const container = render();
    const image = container.querySelector("img");

    expect(image).not.toBeNull();
    expect(image?.getAttribute("alt")).toBe("Useless Achievements trophy");
    expect(image?.getAttribute("width")).toBe("58");
    expect(image?.getAttribute("height")).toBe("58");
  });

  it("provides a home link styled as a button", () => {
    const container = render();
    const link = container.querySelector("a");

    expect(link?.textContent).toBe("Back to Home");
    expect(link?.getAttribute("href")).toBe("/");
    expect(link?.getAttribute("data-slot")).toBe("button");
    expect(container.querySelector("button")).toBeNull();
  });
});
