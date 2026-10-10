import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "./helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
  }),
}));

import { requireAdmin } from "@/lib/auth/require-admin";

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
});

describe("requireAdmin", () => {
  it("returns the authenticated user and verified admin profile", async () => {
    const user = { id: "user-1" };
    const profile = { id: "user-1", role: "admin" };

    mocks.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });

    const query = db.enqueue("profiles", { data: profile });

    await expect(requireAdmin()).resolves.toEqual({
      user,
      profile,
    });

    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(query.select).toHaveBeenCalledWith("id, role");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(query.single).toHaveBeenCalledOnce();
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("rejects a signed-out user without querying profiles", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
    expect(db.from).not.toHaveBeenCalled();
  });

  it("rejects authentication errors even when a user is returned", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: { message: "Session expired" },
    });

    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
    expect(db.from).not.toHaveBeenCalled();
  });

  it("rejects a missing profile", async () => {
    db.enqueue("profiles", { data: null });

    await expect(requireAdmin()).rejects.toThrow(
      "Unable to verify administrator.",
    );
  });

  it("rejects a failed profile lookup", async () => {
    db.enqueue("profiles", {
      error: { message: "Database unavailable" },
    });

    await expect(requireAdmin()).rejects.toThrow(
      "Unable to verify administrator.",
    );
  });

  it("rejects a profile lookup error even if admin data accompanies it", async () => {
    db.enqueue("profiles", {
      data: { id: "user-1", role: "admin" },
      error: { message: "Lookup incomplete" },
    });

    await expect(requireAdmin()).rejects.toThrow(
      "Unable to verify administrator.",
    );
  });

  it.each([
    { label: "ordinary user", profile: { id: "user-1", role: "user" } },
    { label: "missing role", profile: { id: "user-1" } },
    { label: "null role", profile: { id: "user-1", role: null } },
    { label: "uppercase role", profile: { id: "user-1", role: "ADMIN" } },
  ])("rejects an $label profile", async ({ profile }) => {
    db.enqueue("profiles", { data: profile });

    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("propagates an authentication service rejection without querying profiles", async () => {
    mocks.getUser.mockRejectedValue(new Error("Authentication unavailable"));

    await expect(requireAdmin()).rejects.toThrow("Authentication unavailable");
    expect(db.from).not.toHaveBeenCalled();
  });
});
