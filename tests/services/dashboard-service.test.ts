import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { getDashboardData } from "@/lib/dashboard-service";

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mocks.createClient.mockReset();
  mocks.createClient.mockResolvedValue({
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getDashboardData", () => {
  it("returns the user's profile and achievement records", async () => {
    const profile = {
      id: "user-1",
      username: "Player",
      avatar_url: null,
    };
    const achievements = [
      {
        id: "claim-1",
        user_id: "user-1",
        created_at: "2026-10-07T12:00:00.000Z",
        achievements: {
          id: "award-1",
          title: "An unnecessary accomplishment",
        },
      },
    ];

    const profileQuery = db.enqueue("profiles", { data: profile });
    const achievementQuery = db.enqueue("user_achievements", {
      data: achievements,
    });

    await expect(getDashboardData()).resolves.toEqual({
      user: profile,
      achievements,
    });

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(profileQuery.select).toHaveBeenCalledWith("*");
    expect(profileQuery.eq).toHaveBeenCalledWith("id", "user-1");
    expect(profileQuery.single).toHaveBeenCalledOnce();
    expect(achievementQuery.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(achievementQuery.select).toHaveBeenCalledWith(
      expect.stringContaining("achievements (*)"),
    );
    expect(achievementQuery.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("returns a dashboard with an empty achievement list", async () => {
    const profile = { id: "user-1", username: "Player" };
    db.enqueue("profiles", { data: profile });
    db.enqueue("user_achievements", { data: [] });

    await expect(getDashboardData()).resolves.toEqual({
      user: profile,
      achievements: [],
    });
  });

  it("returns null for a signed-out user without querying data", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(getDashboardData()).resolves.toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns null when authentication reports an error", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: { message: "Session expired" },
    });

    await expect(getDashboardData()).resolves.toBeNull();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("returns null when the profile is missing", async () => {
    db.enqueue("profiles", { data: null });

    await expect(getDashboardData()).resolves.toBeNull();

    expect(db.from).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching dashboard profile:",
      null,
    );
  });

  it("returns null and stops when the profile query fails", async () => {
    const error = { message: "Profile unavailable" };
    db.enqueue("profiles", { error });

    await expect(getDashboardData()).resolves.toBeNull();

    expect(db.from).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching dashboard profile:",
      error,
    );
  });

  it("returns null when the achievement query fails", async () => {
    const error = { message: "Achievements unavailable" };

    db.enqueue("profiles", { data: { id: "user-1" } });
    db.enqueue("user_achievements", { error });

    await expect(getDashboardData()).resolves.toBeNull();

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching dashboard achievements:",
      error,
    );
  });

  it("propagates a rejected client initialization", async () => {
    mocks.createClient.mockRejectedValue(
      new Error("Client initialization failed"),
    );

    await expect(getDashboardData()).rejects.toThrow(
      "Client initialization failed",
    );
    expect(db.from).not.toHaveBeenCalled();
  });

  it("propagates a rejected authentication request", async () => {
    mocks.getUser.mockRejectedValue(new Error("Authentication unavailable"));

    await expect(getDashboardData()).rejects.toThrow(
      "Authentication unavailable",
    );
    expect(db.from).not.toHaveBeenCalled();
  });
});
