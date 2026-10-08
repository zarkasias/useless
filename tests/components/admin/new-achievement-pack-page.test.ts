// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPack: vi.fn(),
}));

vi.mock("@/app/admin/achievement-packs/actions", () => ({
  createAchievementPack: mocks.createPack,
}));

import NewAchievementPackPage from "@/app/admin/achievement-packs/new/page";

function render(): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(NewAchievementPackPage),
  );
  return container;
}

describe("NewAchievementPackPage", () => {
  it("renders the heading and enabled submit button", () => {
    const container = render();

    expect(container.querySelector("h1")?.textContent).toBe(
      "Create Achievement Pack",
    );
    expect(container.querySelector("form")).not.toBeNull();

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Create Pack");
    expect(button?.type).toBe("submit");
    expect(button?.disabled).toBe(false);
    expect(mocks.createPack).not.toHaveBeenCalled();
  });

  it("requires a name and slug with associated labels", () => {
    const container = render();

    for (const field of ["name", "slug"]) {
      const input = container.querySelector<HTMLInputElement>(`#${field}`);

      expect(input?.name).toBe(field);
      expect(input?.required).toBe(true);
      expect(input?.value).toBe("");
      expect(container.querySelector(`label[for="${field}"]`)).not.toBeNull();
    }
  });

  it("provides an optional description", () => {
    const container = render();
    const description = container.querySelector("textarea");

    expect(description?.id).toBe("description");
    expect(description?.name).toBe("description");
    expect(description?.required).toBe(false);
    expect(description?.value).toBe("");
    expect(
      container.querySelector('label[for="description"]')?.textContent,
    ).toBe("Description");
  });

  it("offers all pack types and defaults to seasonal", () => {
    const container = render();
    const select = container.querySelector<HTMLSelectElement>("#pack_type");

    expect(select?.name).toBe("pack_type");
    expect(select?.value).toBe("seasonal");
    expect(
      Array.from(select?.options ?? [], (option) => ({
        value: option.value,
        label: option.textContent,
      })),
    ).toEqual([
      { value: "core", label: "Core" },
      { value: "seasonal", label: "Seasonal" },
      { value: "event", label: "Event" },
      { value: "special", label: "Special" },
    ]);
  });

  it("offers all statuses and defaults to draft", () => {
    const container = render();
    const select = container.querySelector<HTMLSelectElement>("#status");

    expect(select?.name).toBe("status");
    expect(select?.value).toBe("draft");
    expect(Array.from(select?.options ?? [], (option) => option.value)).toEqual(
      ["draft", "scheduled", "active", "archived"],
    );
  });

  it("provides optional start and end date-time inputs", () => {
    const container = render();

    for (const field of ["starts_at", "ends_at"]) {
      const input = container.querySelector<HTMLInputElement>(`#${field}`);

      expect(input?.name).toBe(field);
      expect(input?.type).toBe("datetime-local");
      expect(input?.required).toBe(false);
      expect(input?.value).toBe("");
      expect(container.querySelector(`label[for="${field}"]`)).not.toBeNull();
    }
  });
});
