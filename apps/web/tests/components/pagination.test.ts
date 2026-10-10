// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function render(element: Parameters<typeof renderToStaticMarkup>[0]) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("Pagination", () => {
  it("renders labeled navigation containing the supplied page links", () => {
    const container = render(
      createElement(
        Pagination,
        { className: "custom-navigation", id: "pages" },
        createElement(
          PaginationContent,
          { className: "custom-content" },
          createElement(
            PaginationItem,
            { className: "custom-item" },
            createElement(PaginationLink, { href: "?page=1" }, "1"),
          ),
        ),
      ),
    );

    const nav = container.querySelector("nav");
    const list = container.querySelector("ul");
    const item = container.querySelector("li");
    const link = container.querySelector("a");

    expect(nav?.getAttribute("role")).toBe("navigation");
    expect(nav?.getAttribute("aria-label")).toBe("pagination");
    expect(nav?.id).toBe("pages");
    expect(nav?.classList.contains("custom-navigation")).toBe(true);
    expect(list?.classList.contains("custom-content")).toBe(true);
    expect(item?.classList.contains("custom-item")).toBe(true);
    expect(link?.getAttribute("href")).toBe("?page=1");
    expect(link?.textContent).toBe("1");
  });

  it("identifies the active page without marking inactive links current", () => {
    const container = render(
      createElement(
        PaginationContent,
        null,
        createElement(
          PaginationItem,
          null,
          createElement(
            PaginationLink,
            { href: "?page=1", isActive: true },
            "1",
          ),
        ),
        createElement(
          PaginationItem,
          null,
          createElement(
            PaginationLink,
            { href: "?page=2", isActive: false },
            "2",
          ),
        ),
      ),
    );

    const links = container.querySelectorAll("a");

    expect(links[0].getAttribute("aria-current")).toBe("page");
    expect(links[0].getAttribute("data-active")).toBe("true");
    expect(links[1].hasAttribute("aria-current")).toBe(false);
    expect(links[1].getAttribute("data-active")).toBe("false");
  });

  it("forwards custom link labels, classes, and attributes", () => {
    const container = render(
      createElement(
        PaginationLink,
        {
          href: "/results?page=3",
          size: "default",
          className: "custom-link",
          "aria-label": "Page three",
          title: "Third results page",
        },
        "3",
      ),
    );

    const link = container.querySelector("a");

    expect(link?.getAttribute("href")).toBe("/results?page=3");
    expect(link?.getAttribute("aria-label")).toBe("Page three");
    expect(link?.getAttribute("title")).toBe("Third results page");
    expect(link?.classList.contains("custom-link")).toBe(true);
    expect(link?.hasAttribute("aria-current")).toBe(false);
  });

  it("renders labeled previous and next links with their destinations", () => {
    const container = render(
      createElement(
        Pagination,
        null,
        createElement(PaginationPrevious, {
          href: "?page=1",
          className: "previous-link",
        }),
        createElement(PaginationNext, {
          href: "?page=3",
          className: "next-link",
        }),
      ),
    );

    const previous = container.querySelector(
      'a[aria-label="Go to previous page"]',
    );
    const next = container.querySelector('a[aria-label="Go to next page"]');

    expect(previous?.getAttribute("href")).toBe("?page=1");
    expect(previous?.textContent).toContain("Previous");
    expect(previous?.classList.contains("previous-link")).toBe(true);
    expect(next?.getAttribute("href")).toBe("?page=3");
    expect(next?.textContent).toContain("Next");
    expect(next?.classList.contains("next-link")).toBe(true);
  });

  it("renders the ellipsis as a noninteractive decorative element", () => {
    const container = render(
      createElement(PaginationEllipsis, {
        className: "custom-ellipsis",
        title: "Additional pages",
      }),
    );

    const ellipsis = container.querySelector(
      '[data-slot="pagination-ellipsis"]',
    );

    expect(ellipsis?.getAttribute("aria-hidden")).toBe("true");
    expect(ellipsis?.getAttribute("title")).toBe("Additional pages");
    expect(ellipsis?.classList.contains("custom-ellipsis")).toBe(true);
    expect(ellipsis?.textContent).toContain("More pages");
    expect(container.querySelector("a, button")).toBeNull();
  });
});
