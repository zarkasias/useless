import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { updateUserTimezoneAction } from "@/app/actions/timezone-actions";

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

describe("updateUserTimezoneAction", () => {
  it.each([
    { timezone: "America/New_York" },
    { timezone: "Europe/London" },
    { timezone: "UTC" },
  ])("saves the valid timezone $timezone", async ({ timezone }) => {
    const query = db.enqueue("profiles", {});

    await expect(updateUserTimezoneAction(timezone)).resolves.toEqual({
      success: true,
      timezone,
    });

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(query.update).toHaveBeenCalledWith({ timezone });
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("rejects a signed-out user without updating a profile", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(updateUserTimezoneAction("UTC")).resolves.toEqual({
      success: false,
      error: "User is not authenticated.",
    });

    expect(db.from).not.toHaveBeenCalled();
  });

  it("rejects an authentication error even when user data exists", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: { message: "Session expired" },
    });

    await expect(updateUserTimezoneAction("UTC")).resolves.toEqual({
      success: false,
      error: "User is not authenticated.",
    });

    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([{ timezone: "" }, { timezone: "Definitely/Not_A_Timezone" }])(
    "rejects invalid timezone '$timezone'",
    async ({ timezone }) => {
      await expect(updateUserTimezoneAction(timezone)).resolves.toEqual({
        success: false,
        error: "Invalid timezone.",
      });

      expect(db.from).not.toHaveBeenCalled();
    },
  );

  it("returns the existing failure response when the database update fails", async () => {
    const error = { message: "Profile update failed" };
    db.enqueue("profiles", { error });

    await expect(updateUserTimezoneAction("UTC")).resolves.toEqual({
      succes: false,
      error: "Unable to update timezone,",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error updating user timezone:",
      error,
    );
  });

  it("propagates a rejected client initialization", async () => {
    mocks.createClient.mockRejectedValue(
      new Error("Client initialization failed"),
    );

    await expect(updateUserTimezoneAction("UTC")).rejects.toThrow(
      "Client initialization failed",
    );

    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(db.from).not.toHaveBeenCalled();
  });

  it("propagates a rejected authentication request", async () => {
    mocks.getUser.mockRejectedValue(new Error("Authentication unavailable"));

    await expect(updateUserTimezoneAction("UTC")).rejects.toThrow(
      "Authentication unavailable",
    );

    expect(db.from).not.toHaveBeenCalled();
  });
});
