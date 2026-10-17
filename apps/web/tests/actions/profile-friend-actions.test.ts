import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/friend-service-server", () => ({
  sendFriendRequest: mocks.sendFriendRequest,
  acceptFriendRequest: mocks.acceptFriendRequest,
  declineFriendRequest: mocks.declineFriendRequest,
  removeFriend: mocks.removeFriend,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  acceptFriendRequestAction,
  declineFriendRequestAction,
  removeFriendAction,
  sendFriendRequestAction,
} from "@/app/profile/[username]/actions";

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.sendFriendRequest.mockResolvedValue(undefined);
  mocks.acceptFriendRequest.mockResolvedValue(undefined);
  mocks.declineFriendRequest.mockResolvedValue(undefined);
  mocks.removeFriend.mockResolvedValue(undefined);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

const cases = [
  {
    name: "sendFriendRequestAction",
    run: () => sendFriendRequestAction("target-user-1", "Player"),
    service: mocks.sendFriendRequest,
    argument: "target-user-1",
    paths: ["/profile/Player"],
    fallback: "Unable to send friend request.",
    log: "Error sending friend request:",
  },
  {
    name: "acceptFriendRequestAction",
    run: () => acceptFriendRequestAction("friendship-1", "Player"),
    service: mocks.acceptFriendRequest,
    argument: "friendship-1",
    paths: ["/profile/Player"],
    fallback: "Unable to accept friend request.",
    log: null,
  },
  {
    name: "declineFriendRequestAction",
    run: () => declineFriendRequestAction("friendship-1", "Player"),
    service: mocks.declineFriendRequest,
    argument: "friendship-1",
    paths: ["/profile/Player"],
    fallback: "Unable to decline friend request.",
    log: null,
  },
  {
    name: "removeFriendAction",
    run: () => removeFriendAction("friendship-1", "Player"),
    service: mocks.removeFriend,
    argument: "friendship-1",
    paths: ["/profile/Player", "/friends", "/leaderboard"],
    fallback: "Unable to remove friend.",
    log: "Error removing friend:",
  },
];

describe.each(cases)("$name", (testCase) => {
  it("performs the operation and revalidates the affected pages", async () => {
    await expect(testCase.run()).resolves.toEqual({
      success: true,
    });

    expect(testCase.service).toHaveBeenCalledExactlyOnceWith(testCase.argument);

    expect(mocks.revalidatePath.mock.calls).toEqual(
      testCase.paths.map((path) => [path]),
    );

    expect(testCase.service.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.revalidatePath.mock.invocationCallOrder[0],
    );
  });

  it("returns service error messages without revalidating pages", async () => {
    const error = new Error("Friendship operation failed");
    testCase.service.mockRejectedValue(error);

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: "Friendship operation failed",
    });

    expect(mocks.revalidatePath).not.toHaveBeenCalled();

    if (testCase.log) {
      expect(console.error).toHaveBeenCalledWith(testCase.log, error);
    }
  });

  it("uses its fallback message for non-Error failures", async () => {
    testCase.service.mockRejectedValue("Unexpected failure");

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: testCase.fallback,
    });

    expect(mocks.revalidatePath).not.toHaveBeenCalled();

    if (testCase.log) {
      expect(console.error).toHaveBeenCalledWith(
        testCase.log,
        "Unexpected failure",
      );
    }
  });

  it("returns an error if page revalidation fails", async () => {
    mocks.revalidatePath.mockImplementation(() => {
      throw new Error("Revalidation failed");
    });

    await expect(testCase.run()).resolves.toEqual({
      success: false,
      message: "Revalidation failed",
    });

    expect(testCase.service).toHaveBeenCalledExactlyOnceWith(testCase.argument);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(1);
  });
});
