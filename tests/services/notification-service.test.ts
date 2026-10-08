import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
import type { UserNotification } from "@/lib/types/notifications";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

import {
  createNotification,
  getUnreadNotifications,
  markNotificationAsRead,
} from "@/lib/services/notification-service-server";

const NOW = "2026-10-07T12:00:00.000Z";
let db: ReturnType<typeof database>;

function notification(
  overrides: Partial<UserNotification> = {},
): UserNotification {
  return {
    id: "notification-1",
    user_id: "user-1",
    type: "system",
    title: "An unnecessary update",
    message: "Something happened.",
    actor_id: null,
    reference_id: null,
    read_at: null,
    created_at: NOW,
    actor: null,
    ...overrides,
  };
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);

  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("createNotification", () => {
  it("creates a notification with null optional references", async () => {
    const saved = notification();
    const query = db.enqueue("notifications", { data: saved });

    await expect(
      createNotification({
        userId: "user-1",
        type: "system",
        title: saved.title,
        message: saved.message,
      }),
    ).resolves.toEqual(saved);

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "system",
      title: saved.title,
      message: saved.message,
      actor_id: null,
      reference_id: null,
    });
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.single).toHaveBeenCalledOnce();
  });

  it("preserves the specified recipient, actor, and reference", async () => {
    const saved = notification({
      type: "friend_request",
      actor_id: "other-user",
      reference_id: "friendship-1",
    });
    const query = db.enqueue("notifications", { data: saved });

    await expect(
      createNotification({
        userId: "user-1",
        type: "friend_request",
        title: saved.title,
        message: saved.message,
        actorId: "other-user",
        referenceId: "friendship-1",
      }),
    ).resolves.toEqual(saved);

    expect(query.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "friend_request",
      title: saved.title,
      message: saved.message,
      actor_id: "other-user",
      reference_id: "friendship-1",
    });
  });

  it("throws and logs when insertion fails", async () => {
    const error = { message: "Insert failed" };
    db.enqueue("notifications", { error });

    await expect(
      createNotification({
        userId: "user-1",
        type: "system",
        title: "Update",
        message: "Something happened.",
      }),
    ).rejects.toThrow("Unable to create notification.");

    expect(console.error).toHaveBeenCalledWith(
      "Error creating notification:",
      error,
    );
  });
});

describe("getUnreadNotifications", () => {
  it("requests only the user's unread notifications, newest first", async () => {
    const saved = [notification()];
    const query = db.enqueue("notifications", { data: saved });

    await expect(getUnreadNotifications("user-1")).resolves.toEqual(saved);

    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.is).toHaveBeenCalledWith("read_at", null);
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: "null", data: null },
    { label: "empty array", data: [] },
  ])("returns an empty list for $label data", async ({ data }) => {
    db.enqueue("notifications", { data });

    await expect(getUnreadNotifications("user-1")).resolves.toEqual([]);
  });

  it("returns an empty list and logs a lookup failure", async () => {
    const error = { message: "Read failed" };
    db.enqueue("notifications", { error });

    await expect(getUnreadNotifications("user-1")).resolves.toEqual([]);

    expect(console.error).toHaveBeenCalledWith(
      "Error loading unread notifications:",
      error,
    );
  });
});

describe("markNotificationAsRead", () => {
  it("updates the timestamp only for the requested notification and user", async () => {
    const query = db.enqueue("notifications", {});

    await expect(
      markNotificationAsRead("notification-1", "user-1"),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledWith({ read_at: NOW });
    expect(query.eq).toHaveBeenCalledWith("id", "notification-1");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("throws and logs when the update fails", async () => {
    const error = { message: "Update failed" };
    db.enqueue("notifications", { error });

    await expect(
      markNotificationAsRead("notification-1", "user-1"),
    ).rejects.toThrow("Unable to update notification.");

    expect(console.error).toHaveBeenCalledWith(
      "Error marking notification as read:",
      error,
    );
  });
});
