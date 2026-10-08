import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "./helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

import {
  createAnonymousUser,
  getAnonymousUser,
  linkAnonymousUserToAuthenticatedUser,
  updateAnonymousUserTimezone,
} from "@/lib/anonymous-user";

let db: ReturnType<typeof database>;

const now = "2026-10-07T12:00:00.000Z";
const anonymousId = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);

  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(anonymousId);
});

describe("getAnonymousUser", () => {
  it("returns the existing user and updates their last-seen timestamp", async () => {
    const user = {
      id: "anonymous-row-1",
      anonymous_id: anonymousId,
      timezone: "America/New_York",
    };

    const lookup = db.enqueue("anonymous_users", { data: user });
    const update = db.enqueue("anonymous_users", {});

    await expect(getAnonymousUser(anonymousId)).resolves.toEqual(user);

    expect(lookup.select).toHaveBeenCalledWith("*");
    expect(lookup.eq).toHaveBeenCalledWith("anonymous_id", anonymousId);
    expect(lookup.single).toHaveBeenCalledOnce();
    expect(update.update).toHaveBeenCalledWith({ last_seen_at: now });
    expect(update.eq).toHaveBeenCalledWith("id", user.id);
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("returns null when no user exists", async () => {
    db.enqueue("anonymous_users", { data: null });

    await expect(getAnonymousUser(anonymousId)).resolves.toBeNull();

    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("returns null when the lookup reports an error", async () => {
    db.enqueue("anonymous_users", {
      data: { id: "anonymous-row-1" },
      error: { message: "Lookup failed" },
    });

    await expect(getAnonymousUser(anonymousId)).resolves.toBeNull();

    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("returns the user when the last-seen update reports an error", async () => {
    const user = { id: "anonymous-row-1", anonymous_id: anonymousId };

    db.enqueue("anonymous_users", { data: user });
    db.enqueue("anonymous_users", {
      error: { message: "Update failed" },
    });

    await expect(getAnonymousUser(anonymousId)).resolves.toEqual(user);
  });
});

describe("createAnonymousUser", () => {
  it("inserts a generated anonymous ID and returns the saved user", async () => {
    const user = { id: "anonymous-row-1", anonymous_id: anonymousId };
    const query = db.enqueue("anonymous_users", { data: user });

    await expect(createAnonymousUser()).resolves.toEqual(user);

    expect(globalThis.crypto.randomUUID).toHaveBeenCalledOnce();
    expect(query.insert).toHaveBeenCalledWith({
      anonymous_id: anonymousId,
    });
    expect(query.select).toHaveBeenCalledWith();
    expect(query.single).toHaveBeenCalledOnce();
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("logs and throws when insertion reports an error", async () => {
    const error = { message: "Insert failed" };
    db.enqueue("anonymous_users", { error });

    await expect(createAnonymousUser()).rejects.toThrow(
      "Unable to create anonymous user",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error creating anonymous user:",
      error,
    );
  });

  it("logs and throws when insertion returns no user", async () => {
    db.enqueue("anonymous_users", { data: null });

    await expect(createAnonymousUser()).rejects.toThrow(
      "Unable to create anonymous user",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error creating anonymous user:",
      null,
    );
  });
});

describe("updateAnonymousUserTimezone", () => {
  it("updates the timezone and last-seen timestamp for the anonymous ID", async () => {
    const query = db.enqueue("anonymous_users", {});

    await expect(
      updateAnonymousUserTimezone(anonymousId, "America/New_York"),
    ).resolves.toBe(true);

    expect(query.update).toHaveBeenCalledWith({
      timezone: "America/New_York",
      last_seen_at: now,
    });
    expect(query.eq).toHaveBeenCalledWith("anonymous_id", anonymousId);
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("logs the error and returns false when the update fails", async () => {
    const error = { message: "Timezone update failed" };
    db.enqueue("anonymous_users", { error });

    await expect(
      updateAnonymousUserTimezone(anonymousId, "Europe/London"),
    ).resolves.toBe(false);

    expect(console.error).toHaveBeenCalledWith(
      "Error updating anonymous user timezone:",
      error,
    );
  });
});

describe("linkAnonymousUserToAuthenticatedUser", () => {
  it("links the anonymous record to the authenticated user", async () => {
    const query = db.enqueue("anonymous_users", {});

    await expect(
      linkAnonymousUserToAuthenticatedUser(anonymousId, "user-1"),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledWith({
      linked_user_id: "user-1",
    });
    expect(query.eq).toHaveBeenCalledWith("anonymous_id", anonymousId);
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("logs and throws when linking fails", async () => {
    const error = { message: "Link failed" };
    db.enqueue("anonymous_users", { error });

    await expect(
      linkAnonymousUserToAuthenticatedUser(anonymousId, "user-1"),
    ).rejects.toThrow("Unable to link anonymous user.");

    expect(console.error).toHaveBeenCalledWith(
      "Error linking anonymous user to authenticated user:",
      error,
    );
  });
});
