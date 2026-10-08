import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getUnreadNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/services/notification-service-server", () => ({
  getUnreadNotifications: mocks.getUnreadNotifications,
  markNotificationAsRead: mocks.markNotificationAsRead,
}));

vi.mock("@/lib/services/friend-service-server", () => ({
  acceptFriendRequest: mocks.acceptFriendRequest,
  declineFriendRequest: mocks.declineFriendRequest,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  acceptFriendRequestNotificationAction,
  declineFriendRequestNotificationAction,
  getUnreadNotificationsAction,
  markNotificationAsReadAction,
} from "@/app/actions/notification-actions";

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.getUnreadNotifications.mockResolvedValue([]);
  mocks.markNotificationAsRead.mockResolvedValue(undefined);
  mocks.acceptFriendRequest.mockResolvedValue(undefined);
  mocks.declineFriendRequest.mockResolvedValue(undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getUnreadNotificationsAction", () => {
  it("returns notifications for the authenticated user", async () => {
    const notifications = [{ id: "notification-1", is_read: false }];
    mocks.getUnreadNotifications.mockResolvedValue(notifications);

    await expect(getUnreadNotificationsAction()).resolves.toEqual({
      success: true,
      notifications,
    });

    expect(mocks.getUnreadNotifications).toHaveBeenCalledExactlyOnceWith(
      "user-1",
    );
  });

  it("returns an empty list for a signed-out user", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(getUnreadNotificationsAction()).resolves.toEqual({
      success: true,
      notifications: [],
    });

    expect(mocks.getUnreadNotifications).not.toHaveBeenCalled();
  });

  it.each([{ source: "authentication" }, { source: "notification service" }])(
    "handles a rejected $source request",
    async ({ source }) => {
      const error = new Error("Service unavailable");

      if (source === "authentication") {
        mocks.getAuthenticatedUser.mockRejectedValue(error);
      } else {
        mocks.getUnreadNotifications.mockRejectedValue(error);
      }

      await expect(getUnreadNotificationsAction()).resolves.toEqual({
        success: false,
        notifications: [],
        message: "Unable to load notifications.",
      });

      expect(console.error).toHaveBeenCalledWith(
        "Error loading notifications:",
        error,
      );
    },
  );
});

const mutationCases = [
  {
    name: "markNotificationAsReadAction",
    run: () => markNotificationAsReadAction("notification-1"),
    service: mocks.markNotificationAsRead,
    args: ["notification-1", "user-1"],
    log: "Error marking notification as read:",
    fallback: "Unable to update notification.",
    refreshesLeaderboard: false,
    friendAction: false,
  },
  {
    name: "acceptFriendRequestNotificationAction",
    run: () =>
      acceptFriendRequestNotificationAction("friendship-1", "notification-1"),
    service: mocks.acceptFriendRequest,
    args: ["friendship-1"],
    log: "Error accepting friend request:",
    fallback: "Unable to accept friend request.",
    refreshesLeaderboard: true,
    friendAction: true,
  },
  {
    name: "declineFriendRequestNotificationAction",
    run: () =>
      declineFriendRequestNotificationAction("friendship-1", "notification-1"),
    service: mocks.declineFriendRequest,
    args: ["friendship-1"],
    log: "Error declining friend request:",
    fallback: "Unable to decline friend request.",
    refreshesLeaderboard: false,
    friendAction: true,
  },
];

describe.each(mutationCases)("$name", (testCase) => {
  it("performs the requested action for the authenticated user", async () => {
    await expect(testCase.run()).resolves.toEqual({ success: true });

    expect(testCase.service).toHaveBeenCalledExactlyOnceWith(...testCase.args);
    expect(mocks.markNotificationAsRead).toHaveBeenCalledExactlyOnceWith(
      "notification-1",
      "user-1",
    );

    if (testCase.friendAction) {
      expect(testCase.service.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.markNotificationAsRead.mock.invocationCallOrder[0],
      );
    }

    if (testCase.refreshesLeaderboard) {
      expect(mocks.revalidatePath).toHaveBeenCalledExactlyOnceWith(
        "/leaderboard",
      );
      expect(
        mocks.markNotificationAsRead.mock.invocationCallOrder[0],
      ).toBeLessThan(mocks.revalidatePath.mock.invocationCallOrder[0]);
    } else {
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    }
  });

  it("rejects a signed-out user without performing mutations", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: "Authentication required.",
    });

    expect(testCase.service).not.toHaveBeenCalled();
    expect(mocks.markNotificationAsRead).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns authentication errors without performing mutations", async () => {
    mocks.getAuthenticatedUser.mockRejectedValue(
      new Error("Authentication unavailable"),
    );

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: "Authentication unavailable",
    });

    expect(testCase.service).not.toHaveBeenCalled();
    expect(mocks.markNotificationAsRead).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("returns and logs the service error message", async () => {
    const error = new Error("Operation failed");
    testCase.service.mockRejectedValue(error);

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: "Operation failed",
    });

    expect(console.error).toHaveBeenCalledWith(testCase.log, error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();

    if (testCase.friendAction) {
      expect(mocks.markNotificationAsRead).not.toHaveBeenCalled();
    }
  });

  it("uses the fallback message for a non-Error rejection", async () => {
    testCase.service.mockRejectedValue("Unexpected failure");

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: testCase.fallback,
    });

    expect(console.error).toHaveBeenCalledWith(
      testCase.log,
      "Unexpected failure",
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  if (testCase.friendAction) {
    it("reports a failure when marking the notification read fails", async () => {
      mocks.markNotificationAsRead.mockRejectedValue(
        new Error("Notification update failed"),
      );

      await expect(testCase.run()).resolves.toEqual({
        success: false,
        message: "Notification update failed",
      });

      expect(testCase.service).toHaveBeenCalledExactlyOnceWith(
        ...testCase.args,
      );
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    });
  }
});
