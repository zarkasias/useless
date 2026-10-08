import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/notification-service-server", () => ({
  createNotification: mocks.notify,
}));

import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getFriendshipStatus,
  getPendingFriendRequests,
  removeFriend,
  sendFriendRequest,
  type Friendship,
} from "@/lib/services/friend-service-server";

const NOW = "2026-10-07T12:00:00.000Z";
let db: ReturnType<typeof database>;

function friendship(overrides: Partial<Friendship> = {}): Friendship {
  return {
    id: "friendship-1",
    requester_id: "other-user",
    addressee_id: "user-1",
    status: "pending",
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.notify.mockReset();
  mocks.notify.mockResolvedValue(undefined);

  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function expectNoWrites() {
  for (const query of db.queries) {
    expect(query.insert).not.toHaveBeenCalled();
    expect(query.update).not.toHaveBeenCalled();
    expect(query.delete).not.toHaveBeenCalled();
  }
}

describe("friendship status", () => {
  it("returns none for the viewer's own profile without querying", async () => {
    await expect(getFriendshipStatus("user-1", "user-1")).resolves.toEqual({
      id: null,
      status: "none",
    });

    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing", data: null, status: "none", id: null },
    {
      label: "accepted",
      data: friendship({ status: "accepted" }),
      status: "friends",
      id: "friendship-1",
    },
    {
      label: "outgoing",
      data: friendship({
        requester_id: "user-1",
        addressee_id: "other-user",
      }),
      status: "pending_sent",
      id: "friendship-1",
    },
    {
      label: "incoming",
      data: friendship(),
      status: "pending_received",
      id: "friendship-1",
    },
    {
      label: "declined",
      data: friendship({ status: "declined" }),
      status: "none",
      id: null,
    },
    {
      label: "blocked",
      data: friendship({ status: "blocked" }),
      status: "none",
      id: null,
    },
  ])("maps $label relationships", async ({ data, status, id }) => {
    const query = db.enqueue("friendships", { data });

    await expect(getFriendshipStatus("user-1", "other-user")).resolves.toEqual({
      id,
      status,
    });

    expect(query.or).toHaveBeenCalledWith(
      "and(requester_id.eq.user-1,addressee_id.eq.other-user)," +
        "and(requester_id.eq.other-user,addressee_id.eq.user-1)",
    );
  });

  it("throws when the relationship lookup fails", async () => {
    db.enqueue("friendships", {
      error: { message: "Lookup failed" },
    });

    await expect(getFriendshipStatus("user-1", "other-user")).rejects.toThrow(
      "Unable to load friendship.",
    );
  });
});

describe("sending requests", () => {
  it("rejects self-requests before querying", async () => {
    await expect(sendFriendRequest("user-1")).rejects.toThrow(
      "You cannot add yourself as a friend.",
    );

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("returns an existing relationship without creating another request", async () => {
    const existing = friendship();
    db.enqueue("friendships", { data: existing });

    await expect(sendFriendRequest("other-user")).resolves.toEqual(existing);

    expectNoWrites();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("creates a request and notifies its recipient", async () => {
    const saved = friendship({
      requester_id: "user-1",
      addressee_id: "other-user",
    });

    db.enqueue("friendships", { data: null });
    const insert = db.enqueue("friendships", { data: saved });

    await expect(sendFriendRequest("other-user")).resolves.toEqual(saved);

    expect(insert.insert).toHaveBeenCalledWith({
      requester_id: "user-1",
      addressee_id: "other-user",
      status: "pending",
    });
    expect(mocks.notify).toHaveBeenCalledWith({
      userId: "other-user",
      type: "friend_request",
      title: "New Friend Request",
      message: "You received a new friend request.",
      actorId: "user-1",
      referenceId: saved.id,
    });
  });

  it("does not notify when request insertion fails", async () => {
    db.enqueue("friendships", { data: null });
    db.enqueue("friendships", { error: { message: "Insert failed" } });

    await expect(sendFriendRequest("other-user")).rejects.toThrow(
      "Unable to send friend request.",
    );

    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("returns the saved request even if notification delivery fails", async () => {
    const saved = friendship({
      requester_id: "user-1",
      addressee_id: "other-user",
    });
    const error = new Error("Notification unavailable");

    db.enqueue("friendships", { data: null });
    db.enqueue("friendships", { data: saved });
    mocks.notify.mockRejectedValue(error);

    await expect(sendFriendRequest("other-user")).resolves.toEqual(saved);
    expect(console.error).toHaveBeenCalledWith(
      "Friend request created, but notification failed:",
      error,
    );
  });
});

const mutations = [
  {
    name: "accept",
    run: acceptFriendRequest,
    status: "pending" as const,
    missing: "Friend request not found.",
    forbidden: "You cannot accept this friend request.",
    invalid: "This friend request is no longer pending.",
    failed: "Unable to accept friend request.",
  },
  {
    name: "decline",
    run: declineFriendRequest,
    status: "pending" as const,
    missing: "Friend request not found.",
    forbidden: "You cannot decline this friend request.",
    invalid: "This friend request is no longer pending.",
    failed: "Unable to decline friend request.",
  },
  {
    name: "remove",
    run: removeFriend,
    status: "accepted" as const,
    missing: "Friendship not found.",
    forbidden: "You cannot remove this friendship.",
    invalid: "This relationship is not an active friendship.",
    failed: "Unable to remove friend.",
  },
];

describe.each(mutations)("$name authorization and failures", (operation) => {
  it("requires authentication without querying relationships", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(operation.run("friendship-1")).rejects.toThrow(
      "Authentication required.",
    );
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing", result: { data: null } },
    {
      label: "failed lookup",
      result: { error: { message: "Read failed" } },
    },
  ])("rejects a $label relationship", async ({ result }) => {
    db.enqueue("friendships", result);

    await expect(operation.run("friendship-1")).rejects.toThrow(
      operation.missing,
    );
    expectNoWrites();
  });

  it("rejects a relationship belonging to other users", async () => {
    db.enqueue("friendships", {
      data: friendship({
        requester_id: "someone-else",
        addressee_id: "another-user",
        status: operation.status,
      }),
    });

    await expect(operation.run("friendship-1")).rejects.toThrow(
      operation.forbidden,
    );
    expectNoWrites();
  });

  it("rejects an invalid relationship state", async () => {
    db.enqueue("friendships", {
      data: friendship({ status: "blocked" }),
    });

    await expect(operation.run("friendship-1")).rejects.toThrow(
      operation.invalid,
    );
    expectNoWrites();
  });

  it("reports a failed database mutation", async () => {
    db.enqueue("friendships", {
      data: friendship({ status: operation.status }),
    });
    db.enqueue("friendships", {
      error: { message: "Write failed" },
    });

    await expect(operation.run("friendship-1")).rejects.toThrow(
      operation.failed,
    );
  });
});

it("requires authentication to send a request", async () => {
  mocks.getUser.mockResolvedValue(null);

  await expect(sendFriendRequest("other-user")).rejects.toThrow(
    "Authentication required.",
  );
  expect(db.from).not.toHaveBeenCalled();
});

it("does not let the requester accept or decline their own outgoing request", async () => {
  for (const run of [acceptFriendRequest, declineFriendRequest]) {
    db.enqueue("friendships", {
      data: friendship({
        requester_id: "user-1",
        addressee_id: "other-user",
      }),
    });

    await expect(run("friendship-1")).rejects.toThrow(
      /You cannot (accept|decline) this friend request/,
    );
  }

  expectNoWrites();
});

it("accepts an incoming request and returns the updated relationship", async () => {
  db.enqueue("friendships", { data: friendship() });
  const accepted = friendship({ status: "accepted" });
  const update = db.enqueue("friendships", { data: accepted });

  await expect(acceptFriendRequest("friendship-1")).resolves.toEqual(accepted);

  expect(update.update).toHaveBeenCalledWith({
    status: "accepted",
    updated_at: NOW,
  });
  expect(update.eq).toHaveBeenCalledWith("id", "friendship-1");
});

it("declines an incoming request by deleting the relationship", async () => {
  db.enqueue("friendships", { data: friendship() });
  const deletion = db.enqueue("friendships", {});

  await expect(declineFriendRequest("friendship-1")).resolves.toBeUndefined();

  expect(deletion.delete).toHaveBeenCalledOnce();
  expect(deletion.eq).toHaveBeenCalledWith("id", "friendship-1");
});

it.each([
  { role: "requester", requester: "user-1", addressee: "other-user" },
  { role: "recipient", requester: "other-user", addressee: "user-1" },
])(
  "lets the $role remove an accepted friendship",
  async ({ requester, addressee }) => {
    db.enqueue("friendships", {
      data: friendship({
        requester_id: requester,
        addressee_id: addressee,
        status: "accepted",
      }),
    });
    const deletion = db.enqueue("friendships", {});

    await expect(removeFriend("friendship-1")).resolves.toBeUndefined();

    expect(deletion.delete).toHaveBeenCalledOnce();
    expect(deletion.eq).toHaveBeenCalledWith("id", "friendship-1");
  },
);

describe("friend lists", () => {
  it.each([
    { role: "requester", viewerIsRequester: true, arrayJoin: false },
    { role: "recipient", viewerIsRequester: false, arrayJoin: true },
  ])(
    "returns the other person's profile for the $role",
    async ({ viewerIsRequester, arrayJoin }) => {
      const friend = {
        id: "other-user",
        username: "Other",
        avatar_url: null,
      };
      const viewer = {
        id: "user-1",
        username: "Viewer",
        avatar_url: null,
      };
      const related = arrayJoin ? [friend] : friend;

      const query = db.enqueue("friendships", {
        data: [
          {
            ...friendship({
              requester_id: viewerIsRequester ? "user-1" : "other-user",
              addressee_id: viewerIsRequester ? "other-user" : "user-1",
              status: "accepted",
            }),
            requester: viewerIsRequester ? viewer : related,
            addressee: viewerIsRequester ? related : viewer,
          },
        ],
      });

      await expect(getFriends("user-1")).resolves.toEqual([
        {
          friendshipId: "friendship-1",
          friend,
          created_at: NOW,
          updated_at: NOW,
        },
      ]);

      expect(query.eq).toHaveBeenCalledWith("status", "accepted");
      expect(query.or).toHaveBeenCalledWith(
        "requester_id.eq.user-1,addressee_id.eq.user-1",
      );
      expect(query.order).toHaveBeenCalledWith("updated_at", {
        ascending: false,
      });
    },
  );

  it("rejects a relationship with no joined friend profile", async () => {
    db.enqueue("friendships", {
      data: [{ ...friendship(), requester: [] }],
    });

    await expect(getFriends("user-1")).rejects.toThrow(
      "Friend profile not found.",
    );
  });

  it("scopes pending requests to their recipient", async () => {
    const requests = [friendship()];
    const query = db.enqueue("friendships", { data: requests });

    await expect(getPendingFriendRequests("user-1")).resolves.toEqual(requests);

    expect(query.eq).toHaveBeenCalledWith("addressee_id", "user-1");
    expect(query.eq).toHaveBeenCalledWith("status", "pending");
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it.each([
    { name: "friends", run: getFriends, message: "Unable to load friends." },
    {
      name: "pending requests",
      run: getPendingFriendRequests,
      message: "Unable to load friend requests.",
    },
  ])("handles empty data and errors for $name", async ({ run, message }) => {
    db.enqueue("friendships", { data: null });
    await expect(run("user-1")).resolves.toEqual([]);

    db.enqueue("friendships", { error: { message: "Read failed" } });
    await expect(run("user-1")).rejects.toThrow(message);
  });
});
