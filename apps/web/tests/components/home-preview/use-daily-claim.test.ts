// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Achievement } from "@/lib/supabase";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), error: vi.fn() } }));
vi.mock("@/app/actions/achievement-actions", () => ({
  claimDailyAchievementAction: vi.fn(),
}));

const { CLAIM_STORAGE_KEY, useDailyClaim } =
  await import("@/components/home-preview/use-daily-claim");

const achievement = (id: string, title: string) =>
  ({
    id,
    title,
    description: "Did nothing, magnificently.",
    type: "COMMON",
    emoji: "🏆",
    icon_path: null,
  }) as unknown as Achievement;

const SAVED = achievement("saved", "Saved In This Browser");
const SERVER = achievement("server", "Claimed On The Dashboard");

function today() {
  const now = new Date();

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

type Result = ReturnType<typeof useDailyClaim>;
type Options = NonNullable<Parameters<typeof useDailyClaim>[0]>;

describe("useDailyClaim", () => {
  let container: HTMLDivElement;
  let root: Root;
  let result: Result;

  function Probe(props: Options) {
    result = useDailyClaim(props);
    return null;
  }

  const render = (props: Options = {}) =>
    act(() => root.render(createElement(Probe, props)));

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.setItem(
      CLAIM_STORAGE_KEY,
      JSON.stringify({ day: today(), achievement: SAVED }),
    );
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.localStorage.clear();
  });

  it("restores an anonymous visitor's claim saved in this browser", () => {
    render();

    expect(result.checkedStorage).toBe(true);
    expect(result.claimed?.id).toBe("saved");
    expect(result.restored).toBe(true);
  });

  it("prefers the browser's copy for an anonymous visitor", () => {
    render({ todaysClaim: SERVER });

    expect(result.claimed?.id).toBe("saved");
  });

  it("falls back to the server for an anonymous claim made outside the hero, and saves it", () => {
    window.localStorage.clear();
    render({ todaysClaim: SERVER });

    expect(result.claimed?.id).toBe("server");
    expect(result.restored).toBe(true);
    expect(
      JSON.parse(window.localStorage.getItem(CLAIM_STORAGE_KEY) ?? "{}")
        .achievement?.id,
    ).toBe("server");
  });

  it("shows the stream to an anonymous visitor with no claim anywhere", () => {
    window.localStorage.clear();
    render({ todaysClaim: null });

    expect(result.checkedStorage).toBe(true);
    expect(result.claimed).toBeNull();
  });

  it("opens on a signed-in visitor's claim from elsewhere", () => {
    window.localStorage.clear();
    render({ signedIn: true, todaysClaim: SERVER });

    expect(result.claimed?.id).toBe("server");
    expect(result.restored).toBe(true);
  });

  it("trusts the server over this browser for a signed-in visitor", () => {
    render({ signedIn: true, todaysClaim: SERVER });

    expect(result.claimed?.id).toBe("server");
  });

  it("ignores a saved claim when a signed-in visitor hasn't claimed today", () => {
    render({ signedIn: true, todaysClaim: null });

    expect(result.checkedStorage).toBe(true);
    expect(result.claimed).toBeNull();
    expect(result.restored).toBe(false);
  });
});
