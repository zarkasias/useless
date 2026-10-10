import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getAchievements: vi.fn(),
  evaluateTriggers: vi.fn(),
  getLatestMeta: vi.fn(),
  getStreak: vi.fn(),
  getEntitlements: vi.fn(),
  getPacks: vi.fn(),
  getActivity: vi.fn(),
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
  getAuthenticatedUserAchievements: mocks.getAchievements,
  evaluateTriggeredAchievementsForAuthenticatedUser: mocks.evaluateTriggers,
  getLatestMetaAchievement: mocks.getLatestMeta,
}));

vi.mock("@/lib/services/streak-service-server", () => ({
  getAuthenticatedUserStreakData: mocks.getStreak,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/pack-store-service-server", () => ({
  getStoreAchievementPacks: mocks.getPacks,
}));

vi.mock("@/lib/services/activity-service-server", () => ({
  getFriendActivity: mocks.getActivity,
}));

vi.mock("@/app/dashboard/dashboard-client", () => ({
  default: () => null,
}));

import DashboardPage from "@/app/dashboard/page";
import DashboardClient from "@/app/dashboard/dashboard-client";

const profile = { id: "user-1", username: "Alice" };
const achievements = [{ id: "achievement-1" }];
const triggered = [{ id: "triggered-1" }];
const streak = { currentStreak: 3 };
const entitlements = { isSubscribed: true };
const packs = [{ id: "pack-1" }];
const activity = [{ id: "activity-1" }];
const latestMeta = { id: "meta-1" };

const dataLoaders = [
  mocks.getProfile,
  mocks.getAchievements,
  mocks.getStreak,
  mocks.getEntitlements,
  mocks.getPacks,
  mocks.getActivity,
  mocks.getLatestMeta,
];

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.evaluateTriggers.mockResolvedValue(triggered);
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getAchievements.mockResolvedValue(achievements);
  mocks.getStreak.mockResolvedValue(streak);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.getPacks.mockResolvedValue(packs);
  mocks.getActivity.mockResolvedValue(activity);
  mocks.getLatestMeta.mockResolvedValue(latestMeta);

  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("DashboardPage", () => {
  it("passes all loaded data to DashboardClient", async () => {
    const element = await DashboardPage();

    expect(element.type).toBe(DashboardClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialPacks: packs,
      initialAchievements: achievements,
      initialStreakData: streak,
      initialEntitlements: entitlements,
      initialTriggeredAchievements: triggered,
      latestMetaAchievement: latestMeta,
      friendActivity: activity,
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.evaluateTriggers).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getActivity).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getLatestMeta).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors before evaluating or loading data", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(DashboardPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.evaluateTriggers).not.toHaveBeenCalled();
    for (const loader of dataLoaders) {
      expect(loader).not.toHaveBeenCalled();
    }
  });

  it("redirects when the authenticated user has no profile", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(DashboardPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("finishes trigger evaluation before loading dashboard data", async () => {
    let finishEvaluation!: (value: typeof triggered) => void;
    mocks.evaluateTriggers.mockReturnValue(
      new Promise<typeof triggered>((resolve) => {
        finishEvaluation = resolve;
      }),
    );

    const pending = DashboardPage();

    await Promise.resolve();

    expect(mocks.evaluateTriggers).toHaveBeenCalledTimes(1);
    for (const loader of dataLoaders) {
      expect(loader).not.toHaveBeenCalled();
    }

    finishEvaluation(triggered);
    const element = await pending;

    expect(element.props.initialTriggeredAchievements).toBe(triggered);
    for (const loader of dataLoaders) {
      expect(loader).toHaveBeenCalledTimes(1);
    }
  });

  it("propagates trigger evaluation failures before loading dashboard data", async () => {
    const error = new Error("Trigger evaluation failed");
    mocks.evaluateTriggers.mockRejectedValue(error);

    await expect(DashboardPage()).rejects.toBe(error);

    for (const loader of dataLoaders) {
      expect(loader).not.toHaveBeenCalled();
    }
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates dashboard data-loading failures", async () => {
    const error = new Error("Achievements unavailable");
    mocks.getAchievements.mockRejectedValue(error);

    await expect(DashboardPage()).rejects.toBe(error);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
