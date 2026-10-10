// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StreakCalendar } from "@/components/dashboard/streak-calendar";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 7, 12));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function render(achievementDates: string[] = []) {
  await act(async () => {
    root.render(createElement(StreakCalendar, { achievementDates }));
  });
}

function button(label: string) {
  const element = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );

  if (!element) {
    throw new Error(`Missing calendar button: ${label}`);
  }

  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

function dayNumbers() {
  return Array.from(container.querySelectorAll("div"))
    .filter(
      (element) =>
        element.children.length === 0 &&
        /^\d+$/.test(element.textContent ?? ""),
    )
    .map((element) => Number(element.textContent));
}

function claimedDays() {
  return Array.from(
    container.querySelectorAll('[title="Achievement claimed"]'),
    (element) => Number(element.textContent),
  );
}

describe("StreakCalendar", () => {
  it("shows the current month and prevents future navigation", async () => {
    await render();

    expect(container.querySelector("h3")?.textContent).toBe("October 2026");
    expect(dayNumbers()).toEqual(
      Array.from({ length: 31 }, (_, index) => index + 1),
    );
    expect(button("Next month").disabled).toBe(true);

    await click("Next month");

    expect(container.querySelector("h3")?.textContent).toBe("October 2026");
  });

  it("identifies today when it has not been claimed", async () => {
    await render();

    expect(container.querySelector('[title="Today"]')?.textContent).toBe("7");
    expect(claimedDays()).toEqual([]);
  });

  it("marks claimed dates and gives claimed status precedence over Today", async () => {
    await render(["2026-10-03", "2026-10-07", "2026-09-03"]);

    expect(claimedDays()).toEqual([3, 7]);
    expect(container.querySelector('[title="Today"]')).toBeNull();
  });

  it("navigates backward and returns to the current month", async () => {
    await render(["2026-09-03"]);

    await click("Previous month");

    expect(container.querySelector("h3")?.textContent).toBe("September 2026");
    expect(dayNumbers()).toHaveLength(30);
    expect(claimedDays()).toEqual([3]);
    expect(container.querySelector('[title="Today"]')).toBeNull();
    expect(button("Next month").disabled).toBe(false);

    await click("Next month");

    expect(container.querySelector("h3")?.textContent).toBe("October 2026");
    expect(button("Next month").disabled).toBe(true);
  });

  it("handles navigation across a year boundary", async () => {
    vi.setSystemTime(new Date(2026, 0, 7, 12));
    await render(["2025-12-31"]);

    await click("Previous month");

    expect(container.querySelector("h3")?.textContent).toBe("December 2025");
    expect(claimedDays()).toEqual([31]);

    await click("Next month");

    expect(container.querySelector("h3")?.textContent).toBe("January 2026");
  });

  it.each([
    { year: 2024, days: 29 },
    { year: 2025, days: 28 },
  ])("renders $days days in February $year", async ({ year, days }) => {
    vi.setSystemTime(new Date(year, 1, 15, 12));
    await render();

    expect(container.querySelector("h3")?.textContent).toBe(`February ${year}`);
    expect(dayNumbers()).toHaveLength(days);
    expect(dayNumbers().at(-1)).toBe(days);
  });

  it("updates claimed markers when achievement dates change", async () => {
    await render(["2026-10-03"]);

    expect(claimedDays()).toEqual([3]);

    await render(["2026-10-07"]);

    expect(claimedDays()).toEqual([7]);
    expect(container.querySelector('[title="Today"]')).toBeNull();
  });
});
