// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeaderboardUser } from "@/lib/services/leaderboard-service-server";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";

let container: HTMLDivElement;
let root: Root;

function user(
  id: string,
  username: string,
  currentStreak: number,
  achievementCount = 1,
): LeaderboardUser {
  return {
    id,
    username,
    currentStreak,
    achievementCount,
    role: "user",
    created_at: "2026-10-01T12:00:00.000Z",
    streak_count: currentStreak,
  };
}

const users = [
  user("c", "Charlie", 5, 10),
  user("b", "Bob", 5, 20),
  user("a", "Alice", 5, 20),
  user("d", "Dora", 2, 100),
];

beforeEach(() => {
  mocks.push.mockReset();
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
  vi.unstubAllGlobals();
});

async function render(
  records: LeaderboardUser[] = users,
  friendIds: string[] = ["b"],
  isLoading = false,
) {
  await act(async () => {
    root.render(
      createElement(LeaderboardTable, {
        users: records,
        friendIds,
        isLoading,
      }),
    );
  });
}

function names() {
  return Array.from(
    container.querySelectorAll("tbody tr[role='link'] p"),
    (element) => element.textContent,
  );
}

function button(label: string) {
  const element = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!element) {
    throw new Error(`Missing button: ${label}`);
  }

  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

async function search(value: string) {
  const input = container.querySelector<HTMLInputElement>(
    "#leaderboard-search",
  );
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!input || !setter) {
    throw new Error("Missing search input or value setter");
  }

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function sort(value: "highest" | "lowest") {
  const select =
    container.querySelector<HTMLSelectElement>("#leaderboard-sort");

  if (!select) {
    throw new Error("Missing sort control");
  }

  await act(async () => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("LeaderboardTable", () => {
  it("ranks by streak, then achievement count, then user ID", async () => {
    const originalOrder = users.map((record) => record.id);

    await render();

    expect(names()).toEqual(["Alice", "Bob", "Charlie", "Dora"]);
    expect(users.map((record) => record.id)).toEqual(originalOrder);
    expect(container.textContent).toContain("Showing 1–4 of 4 users");
  });

  it("reverses the ranking for lowest-first sorting", async () => {
    await render();
    await sort("lowest");

    expect(names()).toEqual(["Dora", "Charlie", "Bob", "Alice"]);
  });

  it("searches case-insensitively and trims whitespace", async () => {
    await render();
    await search("  ALI  ");

    expect(names()).toEqual(["Alice"]);
    expect(container.textContent).toContain("Showing 1–1 of 1 users");
  });

  it("filters friends and can return to all users", async () => {
    await render();
    await click("Friends");

    expect(names()).toEqual(["Bob"]);

    await click("All Users");

    expect(names()).toEqual(["Alice", "Bob", "Charlie", "Dora"]);
  });

  it.each([
    {
      friends: false,
      term: "",
      message: "No users on the leaderboard yet.",
    },
    {
      friends: false,
      term: "missing",
      message: "No users match your search.",
    },
    {
      friends: true,
      term: "",
      message: "None of your friends are on the leaderboard yet.",
    },
    {
      friends: true,
      term: "missing",
      message: "No friends match your search.",
    },
  ])(
    "shows the correct empty state: $message",
    async ({ friends, term, message }) => {
      await render([], []);

      if (friends) {
        await click("Friends");
      }

      if (term) {
        await search(term);
      }

      expect(container.querySelector('[role="status"]')?.textContent).toBe(
        message,
      );
    },
  );

  it("paginates results and disables navigation at the boundaries", async () => {
    const records = Array.from({ length: 12 }, (_, index) =>
      user(`id-${index}`, `Player${index}`, 12 - index),
    );

    await render(records);

    expect(names()).toHaveLength(10);
    expect(button("Previous").disabled).toBe(true);
    expect(button("Next").disabled).toBe(false);

    await click("Next");

    expect(names()).toEqual(["Player10", "Player11"]);
    expect(container.textContent).toContain("Showing 11–12 of 12 users");
    expect(button("Next").disabled).toBe(true);

    await click("Previous");

    expect(names()).toHaveLength(10);
    expect(container.textContent).toContain("Page 1 of 2");
  });

  it.each([{ control: "search" }, { control: "sort" }, { control: "friends" }])(
    "resets pagination when $control changes",
    async ({ control }) => {
      const records = Array.from({ length: 12 }, (_, index) =>
        user(`id-${index}`, `Player${index}`, 12 - index),
      );

      await render(
        records,
        records.map((record) => record.id),
      );
      await click("Next");

      if (control === "search") {
        await search("Player");
      } else if (control === "sort") {
        await sort("lowest");
      } else {
        await click("Friends");
      }

      expect(container.textContent).toContain("Page 1 of 2");
      expect(button("Previous").disabled).toBe(true);
    },
  );

  it("shows loading placeholders instead of user links", async () => {
    await render(users, [], true);

    expect(container.querySelectorAll('[role="link"]')).toHaveLength(0);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(
      container.querySelector('[aria-label="Leaderboard pages"]'),
    ).toBeNull();
  });

  it.each([
    { selector: "div[role='link']", layout: "mobile" },
    { selector: "tr[role='link']", layout: "desktop" },
  ])(
    "opens profiles from $layout rows by mouse and keyboard",
    async ({ selector }) => {
      await render();

      const row = container.querySelector<HTMLElement>(selector);

      if (!row) {
        throw new Error("Missing leaderboard row");
      }

      await act(async () => {
        row.click();
      });

      expect(mocks.push).toHaveBeenLastCalledWith("/profile/Alice");

      for (const key of ["Enter", " "]) {
        const event = new KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        });

        await act(async () => {
          row.dispatchEvent(event);
        });

        expect(event.defaultPrevented).toBe(true);
        expect(mocks.push).toHaveBeenLastCalledWith("/profile/Alice");
      }

      expect(mocks.push).toHaveBeenCalledTimes(3);

      await act(async () => {
        row.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
          }),
        );
      });

      expect(mocks.push).toHaveBeenCalledTimes(3);
    },
  );
});
