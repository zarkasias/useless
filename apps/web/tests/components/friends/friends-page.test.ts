import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProfile: vi.fn(),
  getFriends: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

vi.mock("@/lib/services/friend-service-server", () => ({
  getFriends: mocks.getFriends,
}));

vi.mock("@/app/friends/friends-client", () => ({
  FriendsClient: () => null,
}));

import FriendsPage from "@/app/friends/page";
import { FriendsClient } from "@/app/friends/friends-client";

const profile = {
  id: "user-1",
  username: "Alice",
  role: "user",
  created_at: "2026-10-08T12:00:00.000Z",
  streak_count: 3,
};

const friends = [
  {
    id: "friend-1",
    username: "Bob",
  },
];

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getProfile.mockResolvedValue(profile);
  mocks.getFriends.mockResolvedValue(friends);
  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("FriendsPage", () => {
  it("loads friends for the authenticated profile and passes data to the client", async () => {
    const element = await FriendsPage();

    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getFriends).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(element.type).toBe(FriendsClient);
    expect(element.props).toEqual({
      user: profile,
      friends,
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects to login when no authenticated profile exists", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(FriendsPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/login");
    expect(mocks.getFriends).not.toHaveBeenCalled();
  });

  it("passes an empty friend list to the client", async () => {
    mocks.getFriends.mockResolvedValue([]);

    const element = await FriendsPage();

    expect(element.props).toEqual({
      user: profile,
      friends: [],
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates profile-loading failures without requesting friends", async () => {
    const error = new Error("Profile service unavailable");
    mocks.getProfile.mockRejectedValue(error);

    await expect(FriendsPage()).rejects.toBe(error);

    expect(mocks.getFriends).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates friend-loading failures", async () => {
    const error = new Error("Friend service unavailable");
    mocks.getFriends.mockRejectedValue(error);

    await expect(FriendsPage()).rejects.toBe(error);

    expect(mocks.getFriends).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
