import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getFriends: vi.fn(),
}));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock("@/lib/services/friend-service-server", () => ({
  getFriends: mocks.getFriends,
}));

import { getFriendActivity } from "@/lib/services/activity-service-server";

const NOW = "2026-10-07T12:00:00.000Z";

const profile = {
  id: "friend-1",
  username: "Player",
  avatar_url: null,
};

const achievement = {
  id: "award-1",
  title: "Pointlessly accomplished",
  type: "common",
  emoji: "🏆",
  icon_path: null,
};

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getFriends.mockReset();
  mocks.getFriends.mockResolvedValue([
    {
      friendshipId: "friendship-1",
      friend: profile,
      created_at: NOW,
      updated_at: NOW,
    },
  ]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function activityRow(join: unknown = achievement) {
  return {
    id: "activity-1",
    user_id: "friend-1",
    created_at: NOW,
    achievement: join,
  };
}

describe("getFriendActivity", () => {
  it("returns no activity without querying when the user has no friends", async () => {
    mocks.getFriends.mockResolvedValue([]);

    await expect(getFriendActivity("user-1")).resolves.toEqual([]);

    expect(mocks.getFriends).toHaveBeenCalledWith("user-1");
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    { label: "object", join: achievement },
    { label: "array", join: [achievement] },
  ])("maps an achievement joined as an $label", async ({ join }) => {
    const activity = db.enqueue("user_achievements", {
      data: [activityRow(join)],
    });
    const profiles = db.enqueue("profiles", {
      data: [profile],
    });

    await expect(getFriendActivity("user-1")).resolves.toEqual([
      {
        id: "activity-1",
        created_at: NOW,
        user: profile,
        achievement,
      },
    ]);

    expect(activity.in).toHaveBeenCalledWith("user_id", ["friend-1"]);
    expect(activity.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(activity.limit).toHaveBeenCalledWith(20);
    expect(profiles.in).toHaveBeenCalledWith("id", ["friend-1"]);
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("passes a custom activity limit to the query", async () => {
    const query = db.enqueue("user_achievements", { data: [] });
    db.enqueue("profiles", { data: [profile] });

    await getFriendActivity("user-1", 5);

    expect(query.limit).toHaveBeenCalledWith(5);
  });

  it("scopes both queries to all returned friend IDs", async () => {
    mocks.getFriends.mockResolvedValue([
      { friend: { id: "friend-1" } },
      { friend: { id: "friend-2" } },
    ]);
    const activity = db.enqueue("user_achievements", { data: [] });
    const profiles = db.enqueue("profiles", { data: [] });

    await getFriendActivity("user-1");

    expect(activity.in).toHaveBeenCalledWith("user_id", [
      "friend-1",
      "friend-2",
    ]);
    expect(profiles.in).toHaveBeenCalledWith("id", ["friend-1", "friend-2"]);
  });

  it("skips missing profiles and missing achievements", async () => {
    db.enqueue("user_achievements", {
      data: [
        { ...activityRow(), id: "missing-profile", user_id: "unknown" },
        { ...activityRow(null), id: "null-achievement" },
        { ...activityRow([]), id: "empty-achievement" },
        activityRow(),
      ],
    });
    db.enqueue("profiles", { data: [profile] });

    await expect(getFriendActivity("user-1")).resolves.toEqual([
      {
        id: "activity-1",
        created_at: NOW,
        user: profile,
        achievement,
      },
    ]);
  });

  it("preserves the activity order returned by the database", async () => {
    const older = "2026-10-06T12:00:00.000Z";

    db.enqueue("user_achievements", {
      data: [
        activityRow(),
        { ...activityRow(), id: "activity-2", created_at: older },
      ],
    });
    db.enqueue("profiles", { data: [profile] });

    const result = await getFriendActivity("user-1");

    expect(result.map((item) => item.id)).toEqual(["activity-1", "activity-2"]);
    expect(result.map((item) => item.created_at)).toEqual([NOW, older]);
  });

  it.each([
    { label: "null activity", rows: null, profiles: [profile] },
    { label: "empty activity", rows: [], profiles: [profile] },
    {
      label: "null profiles",
      rows: [activityRow()],
      profiles: null,
    },
  ])("returns no items for $label", async ({ rows, profiles }) => {
    db.enqueue("user_achievements", { data: rows });
    db.enqueue("profiles", { data: profiles });

    await expect(getFriendActivity("user-1")).resolves.toEqual([]);
  });

  it("throws and logs an activity lookup failure", async () => {
    const error = { message: "Activity unavailable" };

    db.enqueue("user_achievements", { error });
    db.enqueue("profiles", { data: [profile] });

    await expect(getFriendActivity("user-1")).rejects.toThrow(
      "Unable to load friend activity.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error loading friend activity:",
      error,
    );
  });

  it("throws and logs a profile lookup failure", async () => {
    const error = { message: "Profiles unavailable" };

    db.enqueue("user_achievements", { data: [activityRow()] });
    db.enqueue("profiles", { error });

    await expect(getFriendActivity("user-1")).rejects.toThrow(
      "Unable to load friend profiles.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error loading friend profiles:",
      error,
    );
  });

  it("propagates a friend lookup failure without querying activity", async () => {
    mocks.getFriends.mockRejectedValue(new Error("Friends unavailable"));

    await expect(getFriendActivity("user-1")).rejects.toThrow(
      "Friends unavailable",
    );
    expect(db.from).not.toHaveBeenCalled();
  });
});
