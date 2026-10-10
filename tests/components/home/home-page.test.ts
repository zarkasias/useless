import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getEntitlements: vi.fn(),
  getPacks: vi.fn(),
  getFeatured: vi.fn(),
  getProfileAchievements: vi.fn(),
  getStreak: vi.fn(),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
  getFeaturedHeroAchievements: mocks.getFeatured,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/pack-store-service-server", () => ({
  getStoreAchievementPacks: mocks.getPacks,
}));

vi.mock("@/lib/services/profile-service-server", () => ({
  getPublicProfileAchievements: mocks.getProfileAchievements,
}));

vi.mock("@/lib/services/streak-service-server", () => ({
  getUserStreakData: mocks.getStreak,
}));

vi.mock("@/app/home/home-client", () => ({
  default: () => null,
}));

import HomePage, { metadata } from "@/app/page";
import HomeClient from "@/app/home/home-client";

const profile = { id: "user-1", username: "Alice" };
const entitlements = { isSubscribed: true };
const packs = [
  { id: "active-pack", status: "active" },
  { id: "draft-pack", status: "draft" },
  { id: "scheduled-pack", status: "scheduled" },
];

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.getPacks.mockResolvedValue(packs);
  mocks.getFeatured.mockResolvedValue([]);
  mocks.getProfileAchievements.mockResolvedValue([]);
  mocks.getStreak.mockResolvedValue({ currentStreak: 3, longestStreak: 8, achievementDates: [], claimedToday: false });
});

describe("HomePage", () => {
  it("passes account data and non-draft packs to HomeClient", async () => {
    const element = await HomePage();

    expect(element.type).toBe(HomeClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialEntitlements: entitlements,
      initialPacks: [packs[0], packs[2]],
      featuredAchievements: [],
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getPacks).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfileAchievements).not.toHaveBeenCalled();
    expect(mocks.getStreak).not.toHaveBeenCalled();
  });

  it("loads packs for guests without requesting account data", async () => {
    mocks.getUser.mockResolvedValue(null);

    const element = await HomePage();

    expect(element.props).toEqual({
      initialProfile: null,
      initialEntitlements: null,
      initialPacks: [packs[0], packs[2]],
      featuredAchievements: [],
    });
    expect(mocks.getPacks).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getProfileAchievements).not.toHaveBeenCalled();
    expect(mocks.getStreak).not.toHaveBeenCalled();
  });

  it("supports an empty pack list", async () => {
    mocks.getPacks.mockResolvedValue([]);

    const element = await HomePage();

    expect(element.props.initialPacks).toEqual([]);
  });

  it("excludes every pack when only drafts are returned", async () => {
    mocks.getPacks.mockResolvedValue([
      { id: "draft-1", status: "draft" },
      { id: "draft-2", status: "draft" },
    ]);

    const element = await HomePage();

    expect(element.props.initialPacks).toEqual([]);
  });

  it("does not mutate the pack list while filtering", async () => {
    const original = [...packs];

    await HomePage();

    expect(packs).toEqual(original);
    expect(packs).toHaveLength(3);
  });

  it("exports the home page metadata", () => {
    expect(metadata.title).toBe(
      "Useless Achievements - Collect Ridiculously Pointless Achievements",
    );
    expect(metadata.description).toBe(
      "Collect hilariously useless achievements, build your collection, keep a streak, and compete on the leaderboard.",
    );
  });

  it("propagates authentication failures before loading page data", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(HomePage()).rejects.toBe(error);

    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getPacks).not.toHaveBeenCalled();
  });

  it.each(["profile", "entitlements", "packs"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loaders: Record<string, typeof mocks.getProfile> = {
        profile: mocks.getProfile,
        entitlements: mocks.getEntitlements,
        packs: mocks.getPacks,
      };

      loaders[service].mockRejectedValue(error);

      await expect(HomePage()).rejects.toBe(error);
    },
  );
});
