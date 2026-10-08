import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getCollection: vi.fn(),
  getCollected: vi.fn(),
  getEntitlements: vi.fn(),
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
  getCollectionAchievements: mocks.getCollection,
  getAuthenticatedUserAchievements: mocks.getCollected,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/app/collection/achievements-client", () => ({
  default: () => null,
}));

import AchievementsPage from "@/app/collection/page";
import AchievementsClient from "@/app/collection/achievements-client";

const profile = { id: "user-1", username: "Alice" };
const allAchievements = [{ id: "available-1" }, { id: "available-2" }];
const collectedAchievements = [{ id: "collected-1" }];
const entitlements = { isSubscribed: true };

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getCollection.mockResolvedValue(allAchievements);
  mocks.getCollected.mockResolvedValue(collectedAchievements);
  mocks.getEntitlements.mockResolvedValue(entitlements);

  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("AchievementsPage", () => {
  it("passes the profile, collection, collected achievements, and entitlements to the client", async () => {
    const element = await AchievementsPage();

    expect(element.type).toBe(AchievementsClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      allAchievements,
      collectedAchievements,
      initialEntitlements: entitlements,
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getCollection).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getCollected).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors before loading collection data", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(AchievementsPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getCollection).not.toHaveBeenCalled();
    expect(mocks.getCollected).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it("redirects when the authenticated user has no profile", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(AchievementsPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("supports an empty collection", async () => {
    mocks.getCollection.mockResolvedValue([]);
    mocks.getCollected.mockResolvedValue([]);

    const element = await AchievementsPage();

    expect(element.props.allAchievements).toEqual([]);
    expect(element.props.collectedAchievements).toEqual([]);
    expect(element.props.initialProfile).toBe(profile);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(AchievementsPage()).rejects.toBe(error);

    expect(mocks.getCollection).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["collection", "collected achievements", "entitlements"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loader = {
        collection: mocks.getCollection,
        "collected achievements": mocks.getCollected,
        entitlements: mocks.getEntitlements,
      }[service]!;

      loader.mockRejectedValue(error);

      await expect(AchievementsPage()).rejects.toBe(error);
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
