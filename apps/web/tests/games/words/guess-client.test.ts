// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { UserGameStats } from "@/lib/types/games";

const mocks = vi.hoisted(() => ({ navbar: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/components/navbar", () => ({ Navbar: (props: unknown) => { mocks.navbar(props); return null; } }));
vi.mock("@/components/games/words/word-game", () => ({ WordGame: ({ onGameRecorded }: { onGameRecorded?: () => void }) => createElement("button", { id: "word-game", onClick: onGameRecorded }, "Simulate successful record") }));
import GuessClient from "@/app/games/guess/guess-client";

const profile = { id: "player" } as UserProfile;
const entitlements = { isSubscribed: true, subscriptionStatus: "active" } as UserEntitlements;
const stats = { game_type: "guess", games_played: 7, wins: 3, losses: 2 } as UserGameStats;
afterEach(() => vi.unstubAllGlobals());

it("uses the existing GameScreen stats with losses, without unsupported Best or fabricated scores", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(createElement(GuessClient, { initialProfile: profile, initialEntitlements: entitlements, initialStats: stats }));
  expect(mocks.navbar).toHaveBeenCalledWith({ user: profile, isSubscribed: true, subscriptionStatus: "active" });
  expect(container.querySelector("h1")?.textContent).toBe("Useless Guess");
  expect(container.textContent).toContain("7Played3Wins2Losses");
  expect(container.textContent).not.toContain("Best");
  expect(container.textContent).not.toContain("Win Rate");
  expect(container.querySelector('img[src*="guess.webp"]')).not.toBeNull();
  expect(container.querySelectorAll('a[href="/games"]')).toHaveLength(2);
});

it("shows zero counts for no previous sessions", () => {
  const markup = renderToStaticMarkup(createElement(GuessClient, { initialProfile: profile, initialEntitlements: entitlements, initialStats: null }));
  const container = document.createElement("div"); container.innerHTML = markup;
  expect(container.textContent).toContain("0Played0Wins0Losses");
});

it("refreshes the router after a successful recording and displays new server statistics without remounting the game", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.refresh.mockClear();
  const container = document.createElement("div"); document.body.appendChild(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(createElement(GuessClient, { initialProfile: profile, initialEntitlements: entitlements, initialStats: null })));
    const game = container.querySelector<HTMLButtonElement>("#word-game")!;
    await act(async () => game.click());
    expect(mocks.refresh).toHaveBeenCalledOnce();
    await act(async () => root.render(createElement(GuessClient, { initialProfile: profile, initialEntitlements: entitlements, initialStats: stats })));
    expect(container.textContent).toContain("7Played3Wins2Losses");
    expect(container.querySelector("#word-game")).toBe(game);
  } finally {
    await act(async () => root.unmount()); container.remove();
  }
});
