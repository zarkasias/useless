// @vitest-environment jsdom

import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  navbar: vi.fn(),
  gameScreen: vi.fn(),
  spiderGame: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

vi.mock("@/components/games/game-screen", () => ({
  GameScreen: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => {
    mocks.gameScreen(props);
    return createElement("section", null, children);
  },
}));

vi.mock("@/components/games/solitaire/spider/spider-game", () => ({
  SpiderGame: (props: unknown) => {
    mocks.spiderGame(props);
    return null;
  },
}));

import SpiderClient from "@/app/games/spider/spider-client";

type Props = Parameters<typeof SpiderClient>[0];
type Stats = NonNullable<Props["initialStats"]>;

const profile: Props["initialProfile"] = {
  id: "user-1",
  username: "Alice",
  role: "user",
  created_at: "2026-10-08T12:00:00.000Z",
  streak_count: 3,
};

const entitlements: Props["initialEntitlements"] = {
  achievementCount: 5,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 5,
  isSubscribed: true,
  subscriptionStatus: "active",
  billingInterval: "month",
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

const stats: Stats = {
  user_id: "user-1",
  game_type: "spider",
  games_played: 3,
  games_completed: 3,
  wins: 2,
  losses: 1,
  abandoned: 0,
  total_score: 1500,
  best_score: 750,
  total_duration_seconds: 300,
  current_win_streak: 1,
  best_win_streak: 2,
  last_played_at: "2026-10-08T12:00:00.000Z",
  updated_at: "2026-10-08T12:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

function render(overrides: Partial<Props> = {}): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(SpiderClient, {
      initialProfile: profile,
      initialEntitlements: entitlements,
      initialStats: stats,
      ...overrides,
    }),
  );
  return container;
}

describe("SpiderClient", () => {
  it("passes account details to the navbar", () => {
    const container = render();

    expect(container.querySelector("main")).not.toBeNull();
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("passes game details and rounded statistics to GameScreen", () => {
    render();

    expect(mocks.gameScreen).toHaveBeenCalledExactlyOnceWith({
      title: "Useless Spider Solitaire",
      description:
        "Eight legs. Ten columns. Absolutely no reason to be productive.",
      icon: "/game_icons/spider.webp",
      gamesPlayed: 3,
      wins: 2,
      winRate: 67,
      bestScoreLabel: "Best",
      bestScore: 750,
    });
  });

  it("defaults statistics when no game stats exist", () => {
    render({ initialStats: null });

    expect(mocks.gameScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        bestScore: null,
      }),
    );
  });

  it("uses a zero win rate when no games have been played", () => {
    render({
      initialStats: {
        ...stats,
        games_played: 0,
        wins: 0,
        best_score: null,
      },
    });

    expect(mocks.gameScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        gamesPlayed: 0,
        wins: 0,
        winRate: 0,
        bestScore: null,
      }),
    );
  });

  it("preserves a best score of zero", () => {
    render({ initialStats: { ...stats, best_score: 0 } });

    expect(mocks.gameScreen).toHaveBeenCalledWith(
      expect.objectContaining({ bestScore: 0 }),
    );
  });

  it("refreshes the router after a game is recorded", () => {
    render();

    expect(mocks.spiderGame).toHaveBeenCalledExactlyOnceWith({
      onGameRecorded: expect.any(Function),
    });
    expect(mocks.refresh).not.toHaveBeenCalled();

    const gameProps = mocks.spiderGame.mock.calls[0][0] as {
      onGameRecorded: () => void;
    };
    gameProps.onGameRecorded();

    expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith();
  });
});
