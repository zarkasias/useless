import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getUsers: vi.fn(),
  getEntitlements: vi.fn(),
  getFriends: vi.fn(),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

vi.mock("@/lib/services/leaderboard-service-server", () => ({
  getLeaderboardUsers: mocks.getUsers,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/lib/services/friend-service-server", () => ({
  getFriends: mocks.getFriends,
}));

vi.mock("@/app/leaderboard/leaderboard-client", () => ({
  default: () => null,
}));

import LeaderboardPage from "@/app/leaderboard/page";
import LeaderboardClient from "@/app/leaderboard/leaderboard-client";

const profile = { id: "user-1", username: "Alice" };
const users = [{ id: "leader-1", achievementCount: 12 }];
const entitlements = { isSubscribed: true };

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getUsers.mockResolvedValue(users);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.getFriends.mockResolvedValue([
    { id: "relationship-1", friend: { id: "friend-1" } },
    { id: "relationship-2", friend: { id: "friend-2" } },
  ]);
});

describe("LeaderboardPage", () => {
  it("passes loaded data and friend profile IDs to the client", async () => {
    const element = await LeaderboardPage();

    expect(element.type).toBe(LeaderboardClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialUsers: users,
      initialEntitlements: entitlements,
      friendIds: ["friend-1", "friend-2"],
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getUsers).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.getFriends).toHaveBeenCalledExactlyOnceWith("user-1");
  });

  it("supports guests without requesting entitlements or friends", async () => {
    mocks.getUser.mockResolvedValue(null);
    mocks.getProfile.mockResolvedValue(null);

    const element = await LeaderboardPage();

    expect(element.props).toEqual({
      initialProfile: null,
      initialUsers: users,
      initialEntitlements: null,
      friendIds: [],
    });
    expect(mocks.getUsers).toHaveBeenCalledTimes(1);
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getFriends).not.toHaveBeenCalled();
  });

  it.each([null, []])(
    "handles an absent or empty friend list: %j",
    async (friends) => {
      mocks.getFriends.mockResolvedValue(friends);

      const element = await LeaderboardPage();

      expect(element.props.friendIds).toEqual([]);
    },
  );

  it("supports an empty leaderboard", async () => {
    mocks.getUsers.mockResolvedValue([]);

    const element = await LeaderboardPage();

    expect(element.props.initialUsers).toEqual([]);
    expect(element.props.initialProfile).toBe(profile);
  });

  it("propagates authentication failures before loading page data", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(LeaderboardPage()).rejects.toBe(error);

    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getUsers).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.getFriends).not.toHaveBeenCalled();
  });

  it.each(["profile", "leaderboard", "entitlements", "friends"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loaders: Record<string, typeof mocks.getProfile> = {
        profile: mocks.getProfile,
        leaderboard: mocks.getUsers,
        entitlements: mocks.getEntitlements,
        friends: mocks.getFriends,
      };

      loaders[service].mockRejectedValue(error);

      await expect(LeaderboardPage()).rejects.toBe(error);
    },
  );
});
