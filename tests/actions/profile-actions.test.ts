import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  updateAvatarAction,
  updateUsernameAction,
} from "@/app/actions/profile-actions";

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

  mocks.revalidatePath.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("updateUsernameAction", () => {
  it.each([
    { input: "  Player  ", expected: "Player" },
    { input: "abc", expected: "abc" },
    { input: "a".repeat(30), expected: "a".repeat(30) },
  ])("saves the valid username '$input'", async ({ input, expected }) => {
    const query = db.enqueue("profiles", {});

    await expect(updateUsernameAction(input)).resolves.toEqual({
      success: true,
      username: expected,
    });

    expect(query.update).toHaveBeenCalledWith({ username: expected });
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(2);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it.each([
    { input: "" },
    { input: "   " },
    { input: "ab" },
    { input: "  ab  " },
  ])("rejects a short username '$input'", async ({ input }) => {
    await expect(updateUsernameAction(input)).resolves.toEqual({
      success: false,
      error: "Username must be at least 3 characters.",
    });

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects usernames longer than 30 characters", async () => {
    await expect(updateUsernameAction("a".repeat(31))).resolves.toEqual({
      success: false,
      error: "Username must be 30 characters or fewer.",
    });

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it.each([
    {
      code: "23505",
      expected: "That username is already taken.",
    },
    {
      code: "42501",
      expected: "Unable to update your username.",
    },
  ])("handles database error $code", async ({ code, expected }) => {
    const error = { code, message: "Update failed" };
    db.enqueue("profiles", { error });

    await expect(updateUsernameAction("Player")).resolves.toEqual({
      success: false,
      error: expected,
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error updating username:",
      error,
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateAvatarAction", () => {
  it("saves the avatar URL and revalidates profile pages", async () => {
    const avatarUrl = "https://example.com/avatar.png";
    const query = db.enqueue("profiles", {});

    await expect(updateAvatarAction(avatarUrl)).resolves.toEqual({
      success: true,
      avatarUrl,
    });

    expect(query.update).toHaveBeenCalledWith({
      avatar_url: avatarUrl,
    });
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledTimes(2);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/profile");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("reports and logs a database update failure", async () => {
    const error = { message: "Update failed" };
    db.enqueue("profiles", { error });

    await expect(
      updateAvatarAction("https://example.com/avatar.png"),
    ).resolves.toEqual({
      success: false,
      error: "Unable to update your avatar.",
    });

    expect(console.error).toHaveBeenCalledWith("Error updating avatar:", error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe.each([
  {
    name: "updateUsernameAction",
    run: () => updateUsernameAction("Player"),
  },
  {
    name: "updateAvatarAction",
    run: () => updateAvatarAction("https://example.com/avatar.png"),
  },
])("$name authentication", ({ run }) => {
  it("rejects a signed-out user", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(run()).resolves.toEqual({
      success: false,
      error: "You must be logged in to update your profile.",
    });

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an authentication error even when user data exists", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: { message: "Session expired" },
    });

    await expect(run()).resolves.toEqual({
      success: false,
      error: "You must be logged in to update your profile.",
    });

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("propagates a rejected client initialization", async () => {
    const error = new Error("Client initialization failed");
    mocks.createClient.mockRejectedValue(error);

    await expect(run()).rejects.toBe(error);

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("propagates a rejected authentication request", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(run()).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
