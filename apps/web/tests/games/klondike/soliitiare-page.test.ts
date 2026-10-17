import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getEntitlements: vi.fn(),
  getStats: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/game-service-server", () => ({
  getAuthenticatedGameStats: mocks.getStats,
}));

vi.mock("@/app/games/solitaire/solitaire-client", () => ({
  default: () => null,
}));

import SolitairePage from "@/app/games/solitaire/page";
import SolitaireClient from "@/app/games/solitaire/solitaire-client";

const profile = { id: "user-1", username: "Alice" };
const entitlements = {
  isSubscribed: true,
  subscriptionStatus: "active",
};
const stats = {
  game_type: "solitaire",
  games_played: 3,
  wins: 1,
  best_score: 750,
};

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getProfile.mockResolvedValue(profile);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.getStats.mockResolvedValue(stats);

  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("SolitairePage", () => {
  it("passes the profile, entitlements, and Solitaire stats to the client", async () => {
    const element = await SolitairePage();

    expect(element.type).toBe(SolitaireClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialEntitlements: entitlements,
      initialStats: stats,
    });

    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getStats).toHaveBeenCalledExactlyOnceWith("solitaire");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects visitors without a profile to login with the return URL", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(SolitairePage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/login?next=/games/solitaire",
    );
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getStats).not.toHaveBeenCalled();
  });

  it("redirects unsubscribed users to the games page", async () => {
    mocks.getEntitlements.mockResolvedValue({
      isSubscribed: false,
      subscriptionStatus: "canceled",
    });

    await expect(SolitairePage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/games");
  });

  it("supports a subscribed user with no previous game stats", async () => {
    mocks.getStats.mockResolvedValue(null);

    const element = await SolitairePage();

    expect(element.props.initialStats).toBeNull();
    expect(element.props.initialProfile).toBe(profile);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates profile-loading failures before requesting other data", async () => {
    const error = new Error("Profile unavailable");
    mocks.getProfile.mockRejectedValue(error);

    await expect(SolitairePage()).rejects.toBe(error);

    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getStats).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["entitlements", "stats"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loader =
        service === "entitlements" ? mocks.getEntitlements : mocks.getStats;

      loader.mockRejectedValue(error);

      await expect(SolitairePage()).rejects.toBe(error);
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
