import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getEntitlements: vi.fn(),
  getAchievements: vi.fn(),
  getStats: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/game-service-server", () => ({
  getAuthenticatedMemoryAchievements: mocks.getAchievements,
  getAuthenticatedGameStats: mocks.getStats,
}));

vi.mock("@/app/games/memory/memory-client", () => ({
  default: () => null,
}));

import MemoryGamePage from "@/app/games/memory/page";
import MemoryClient from "@/app/games/memory/memory-client";

const profile = { id: "user-1", username: "Alice" };
const entitlements = { isSubscribed: true };
const achievements = Array.from({ length: 6 }, (_, index) => ({
  id: `achievement-${index}`,
}));
const stats = { gamesPlayed: 4, gamesWon: 2 };

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.getAchievements.mockResolvedValue(achievements);
  mocks.getStats.mockResolvedValue(stats);

  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("MemoryGamePage", () => {
  it("loads six achievements and memory stats and passes data to the client", async () => {
    const element = await MemoryGamePage();

    expect(element.type).toBe(MemoryClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialEntitlements: entitlements,
      initialAchievements: achievements,
      initialStats: stats,
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith(6);
    expect(mocks.getStats).toHaveBeenCalledExactlyOnceWith("memory");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors before loading game data", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(MemoryGamePage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getAchievements).not.toHaveBeenCalled();
    expect(mocks.getStats).not.toHaveBeenCalled();
  });

  it("redirects users without a profile to home", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(MemoryGamePage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("redirects unsubscribed users to the games page", async () => {
    mocks.getEntitlements.mockResolvedValue({ isSubscribed: false });

    await expect(MemoryGamePage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/games");
  });

  it.each([0, 5])(
    "redirects when only %i achievements are available",
    async (count) => {
      mocks.getAchievements.mockResolvedValue(achievements.slice(0, count));

      await expect(MemoryGamePage()).rejects.toThrow("TEST_REDIRECT");

      expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/games");
    },
  );

  it("allows more than six returned achievements", async () => {
    const extraAchievements = [...achievements, { id: "extra-achievement" }];
    mocks.getAchievements.mockResolvedValue(extraAchievements);

    const element = await MemoryGamePage();

    expect(element.props.initialAchievements).toBe(extraAchievements);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["profile", "entitlements", "achievements", "stats"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loaders: Record<string, typeof mocks.getProfile> = {
        profile: mocks.getProfile,
        entitlements: mocks.getEntitlements,
        achievements: mocks.getAchievements,
        stats: mocks.getStats,
      };
      loaders[service].mockRejectedValue(error);

      await expect(MemoryGamePage()).rejects.toBe(error);
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
