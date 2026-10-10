// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mocks.usePathname,
}));

import { AdminNav } from "@/components/admin/admin-nav";

beforeEach(() => {
  mocks.usePathname.mockReturnValue("/admin");
});

function render(pathname = "/admin"): HTMLDivElement {
  mocks.usePathname.mockReturnValue(pathname);

  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(createElement(AdminNav));
  return container;
}

function activeLabels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("a"))
    .filter((link) => link.classList.contains("bg-gray-700"))
    .map((link) => link.textContent ?? "");
}

describe("AdminNav", () => {
  it("renders every admin destination and the exit link", () => {
    const container = render();

    expect(container.querySelector("nav")).not.toBeNull();

    expect(
      Array.from(container.querySelectorAll("a"), (link) => ({
        label: link.textContent,
        href: link.getAttribute("href"),
      })),
    ).toEqual([
      { label: "Dashboard", href: "/admin" },
      { label: "Achievements", href: "/admin/achievements" },
      { label: "Packs", href: "/admin/achievement-packs" },
      { label: "Generator", href: "/admin/achievement-generator" },
      { label: "Exit Admin", href: "/dashboard" },
    ]);
  });

  it.each([
    { path: "/admin", label: "Dashboard" },
    { path: "/admin/achievements", label: "Achievements" },
    { path: "/admin/achievements/achievement-123", label: "Achievements" },
    { path: "/admin/achievement-packs", label: "Packs" },
    { path: "/admin/achievement-packs/pack-123", label: "Packs" },
    { path: "/admin/achievement-generator", label: "Generator" },
  ])("highlights only $label at $path", ({ path, label }) => {
    expect(activeLabels(render(path))).toEqual([label]);
  });

  it("does not highlight Dashboard for an unrelated admin page", () => {
    expect(activeLabels(render("/admin/settings"))).toEqual([]);
  });

  it("does not highlight an admin destination outside the admin area", () => {
    expect(activeLabels(render("/dashboard"))).toEqual([]);
  });
});
