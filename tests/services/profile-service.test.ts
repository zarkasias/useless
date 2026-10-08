import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import {
  getPublicProfileAchievements,
  getPublicProfileByUsername,
} from "@/lib/services/profile-service-server";

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("public profile lookup", () => {
  it("requests only public fields for the specified username", async () => {
    const profile = {
      id: "user-1",
      username: "Player",
      avatar_url: null,
    };
    const query = db.enqueue("profiles", { data: profile });

    await expect(getPublicProfileByUsername("Player")).resolves.toEqual(
      profile,
    );

    expect(query.select).toHaveBeenCalledWith("id, username, avatar_url");
    expect(query.eq).toHaveBeenCalledWith("username", "Player");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("returns null when the profile does not exist", async () => {
    db.enqueue("profiles", { data: null });

    await expect(getPublicProfileByUsername("Missing")).resolves.toBeNull();
  });

  it("returns null and logs a lookup error", async () => {
    const error = { message: "Read failed" };
    db.enqueue("profiles", { error });

    await expect(getPublicProfileByUsername("Player")).resolves.toBeNull();

    expect(console.error).toHaveBeenCalledWith(
      "Error loading public profile:",
      error,
    );
  });
});

describe("public profile achievements", () => {
  it.each([
    { label: "object", arrayJoin: false },
    { label: "array", arrayJoin: true },
  ])(
    "maps an $label join and preserves the earning timestamp",
    async ({ arrayJoin }) => {
      const achievement = {
        id: "award-1",
        title: "Pointlessly accomplished",
        description: "An achievement",
        type: "common",
        emoji: "🏆",
        icon_path: null,
        created_at: "2026-01-01T00:00:00.000Z",
        is_daily: true,
        is_secret: false,
        trigger_type: "daily_claim",
        trigger_config: null,
        status: "published",
      };
      const earnedAt = "2026-10-07T12:00:00.000Z";

      const query = db.enqueue("user_achievements", {
        data: [
          {
            created_at: earnedAt,
            achievements: arrayJoin ? [achievement] : achievement,
          },
        ],
      });

      await expect(getPublicProfileAchievements("user-1")).resolves.toEqual([
        {
          ...achievement,
          user_id: "user-1",
          created_at: earnedAt,
        },
      ]);

      expect(query.select).toHaveBeenCalledWith(
        expect.stringContaining("achievements!inner"),
      );
      expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(query.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    },
  );

  it.each([
    { label: "null", data: null },
    { label: "empty array", data: [] },
  ])("returns an empty list for $label data", async ({ data }) => {
    db.enqueue("user_achievements", { data });

    await expect(getPublicProfileAchievements("user-1")).resolves.toEqual([]);
  });

  it("skips absent joins and empty joined arrays", async () => {
    const valid = {
      id: "valid-award",
      title: "Valid achievement",
    };

    db.enqueue("user_achievements", {
      data: [
        { created_at: "2026-10-07T12:00:00.000Z", achievements: null },
        { created_at: "2026-10-06T12:00:00.000Z", achievements: [] },
        { created_at: "2026-10-05T12:00:00.000Z" },
        {
          created_at: "2026-10-04T12:00:00.000Z",
          achievements: valid,
        },
      ],
    });

    await expect(getPublicProfileAchievements("user-1")).resolves.toEqual([
      {
        ...valid,
        user_id: "user-1",
        created_at: "2026-10-04T12:00:00.000Z",
      },
    ]);
  });

  it("returns an empty list and logs a database error", async () => {
    const error = { message: "Read failed" };
    db.enqueue("user_achievements", { error });

    await expect(getPublicProfileAchievements("user-1")).resolves.toEqual([]);

    expect(console.error).toHaveBeenCalledWith(
      "Error loading public profile achievements:",
      error,
    );
  });
});
