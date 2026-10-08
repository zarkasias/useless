import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getAchievements: vi.fn(),
  getStreak: vi.fn(),
  getViewer: vi.fn(),
  getEntitlements: vi.fn(),
  getFriendship: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/lib/services/profile-service-server", () => ({
  getPublicProfileByUsername: mocks.getProfile,
  getPublicProfileAchievements: mocks.getAchievements,
}));

vi.mock("@/lib/services/streak-service-server", () => ({
  getUserStreakData: mocks.getStreak,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getViewer,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/friend-service-server", () => ({
  getFriendshipStatus: mocks.getFriendship,
}));

vi.mock("@/app/profile/[username]/profile-client", () => ({
  ProfileClient: () => null,
}));

import ProfilePage from "@/app/profile/[username]/page";
import { ProfileClient } from "@/app/profile/[username]/profile-client";

const profile = { id: "profile-1", username: "Alice" };
const viewer = { id: "viewer-1", username: "Bob" };
const achievements = [{ id: "achievement-1" }];
const streak = { currentStreak: 3 };
const entitlements = { isSubscribed: true };
const friendship = { id: "friendship-1", status: "accepted" };

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getProfile.mockResolvedValue(profile);
  mocks.getAchievements.mockResolvedValue(achievements);
  mocks.getStreak.mockResolvedValue(streak);
  mocks.getViewer.mockResolvedValue(viewer);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.getFriendship.mockResolvedValue(friendship);

  mocks.notFound.mockImplementation(() => {
    throw new Error("TEST_NOT_FOUND");
  });
});

function render() {
  return ProfilePage({
    params: Promise.resolve({ username: "Alice" }),
  });
}

describe("ProfilePage", () => {
  it("loads the profile and viewer relationship and passes data to the client", async () => {
    const element = await render();

    expect(element.type).toBe(ProfileClient);
    expect(element.props).toEqual({
      profile,
      achievements,
      streakData: streak,
      viewer,
      viewerEntitlements: entitlements,
      friendshipState: friendship,
    });

    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith("Alice");
    expect(mocks.getAchievements).toHaveBeenCalledExactlyOnceWith("profile-1");
    expect(mocks.getStreak).toHaveBeenCalledExactlyOnceWith("profile-1");
    expect(mocks.getViewer).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("viewer-1");
    expect(mocks.getFriendship).toHaveBeenCalledExactlyOnceWith(
      "viewer-1",
      "profile-1",
    );
  });

  it("supports guests without loading viewer entitlements or friendship", async () => {
    mocks.getViewer.mockResolvedValue(null);

    const element = await render();

    expect(element.props.viewer).toBeNull();
    expect(element.props.viewerEntitlements).toBeNull();
    expect(element.props.friendshipState).toEqual({
      id: null,
      status: "none",
    });
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getFriendship).not.toHaveBeenCalled();
  });

  it("skips friendship lookup when viewing your own profile", async () => {
    mocks.getViewer.mockResolvedValue(profile);

    const element = await render();

    expect(element.props.viewer).toBe(profile);
    expect(element.props.friendshipState).toEqual({
      id: null,
      status: "none",
    });
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("profile-1");
    expect(mocks.getFriendship).not.toHaveBeenCalled();
  });

  it("supports a profile with no public achievements", async () => {
    mocks.getAchievements.mockResolvedValue([]);

    const element = await render();

    expect(element.props.achievements).toEqual([]);
    expect(element.props.profile).toBe(profile);
  });

  it("returns not found before loading further data for an unknown profile", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(render()).rejects.toThrow("TEST_NOT_FOUND");

    expect(mocks.notFound).toHaveBeenCalledTimes(1);
    expect(mocks.getAchievements).not.toHaveBeenCalled();
    expect(mocks.getStreak).not.toHaveBeenCalled();
    expect(mocks.getViewer).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getFriendship).not.toHaveBeenCalled();
  });

  it("propagates profile lookup failures before loading further data", async () => {
    const error = new Error("Profile lookup unavailable");
    mocks.getProfile.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);

    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.getAchievements).not.toHaveBeenCalled();
    expect(mocks.getViewer).not.toHaveBeenCalled();
  });

  it.each(["achievements", "streak", "viewer", "entitlements", "friendship"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loaders: Record<string, typeof mocks.getProfile> = {
        achievements: mocks.getAchievements,
        streak: mocks.getStreak,
        viewer: mocks.getViewer,
        entitlements: mocks.getEntitlements,
        friendship: mocks.getFriendship,
      };

      loaders[service].mockRejectedValue(error);

      await expect(render()).rejects.toBe(error);
      expect(mocks.notFound).not.toHaveBeenCalled();
    },
  );
});
