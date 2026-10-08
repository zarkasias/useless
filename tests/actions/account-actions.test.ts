import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  list: vi.fn(),
  remove: vi.fn(),
  deleteUser: vi.fn(),
  deleteCustomer: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: mocks.from,
    storage: { from: mocks.storageFrom },
    auth: { admin: { deleteUser: mocks.deleteUser } },
  }),
}));

vi.mock("@/lib/stripe-server", () => ({
  stripe: { customers: { del: mocks.deleteCustomer } },
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { deleteAccountAction } from "@/app/actions/account-actions";

let db: ReturnType<typeof database>;
const redirectSignal = new Error("Redirect");

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  mocks.storageFrom.mockReturnValue({
    list: mocks.list,
    remove: mocks.remove,
  });
  mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.deleteCustomer.mockResolvedValue({ deleted: true });
  mocks.redirect.mockImplementation(() => {
    throw redirectSignal;
  });

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("deleteAccountAction", () => {
  it("rejects a signed-out user without starting deletion", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error: "You must be logged in to delete your account.",
    });

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.deleteCustomer).not.toHaveBeenCalled();
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("deletes a free user's account and redirects", async () => {
    const query = db.enqueue("subscriptions", { data: null });

    await expect(deleteAccountAction()).rejects.toBe(redirectSignal);

    expect(query.select).toHaveBeenCalledWith("provider_customer_id");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.maybeSingle).toHaveBeenCalledOnce();

    expect(mocks.deleteCustomer).not.toHaveBeenCalled();
    expect(mocks.storageFrom).toHaveBeenCalledExactlyOnceWith("avatars");
    expect(mocks.list).toHaveBeenCalledExactlyOnceWith("", {
      limit: 1000,
      search: "user-1-",
    });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.deleteUser.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.redirect.mock.invocationCallOrder[0],
    );
  });

  it("removes the Stripe customer and avatar files before deleting the user", async () => {
    db.enqueue("subscriptions", {
      data: { provider_customer_id: "cus_123" },
    });
    mocks.list.mockResolvedValue({
      data: [{ name: "user-1-first.png" }, { name: "user-1-second.png" }],
      error: null,
    });

    await expect(deleteAccountAction()).rejects.toBe(redirectSignal);

    expect(mocks.deleteCustomer).toHaveBeenCalledExactlyOnceWith("cus_123");
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith([
      "user-1-first.png",
      "user-1-second.png",
    ]);
    expect(mocks.deleteUser).toHaveBeenCalledExactlyOnceWith("user-1");

    expect(mocks.deleteCustomer.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.list.mock.invocationCallOrder[0],
    );
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteUser.mock.invocationCallOrder[0],
    );
  });

  it("skips Stripe deletion when the subscription has no customer ID", async () => {
    db.enqueue("subscriptions", {
      data: { provider_customer_id: null },
    });

    await expect(deleteAccountAction()).rejects.toBe(redirectSignal);

    expect(mocks.deleteCustomer).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledOnce();
  });

  it("continues when the avatar listing returns null without an error", async () => {
    db.enqueue("subscriptions", { data: null });
    mocks.list.mockResolvedValue({ data: null, error: null });

    await expect(deleteAccountAction()).rejects.toBe(redirectSignal);

    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledOnce();
  });

  it("stops when loading the subscription fails", async () => {
    const error = { message: "Subscription lookup failed" };
    db.enqueue("subscriptions", { error });

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error: "Unable to delete your account.",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error loading subscription during account deletion:",
      error,
    );
    expect(mocks.deleteCustomer).not.toHaveBeenCalled();
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("stops when deleting the Stripe customer fails", async () => {
    const error = new Error("Stripe unavailable");
    db.enqueue("subscriptions", {
      data: { provider_customer_id: "cus_123" },
    });
    mocks.deleteCustomer.mockRejectedValue(error);

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error:
        "Unable to cancel your subscription. Your account was not deleted.",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error deleting Stripe customer:",
      error,
    );
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("stops when listing avatar files fails", async () => {
    const error = { message: "Storage lookup failed" };
    db.enqueue("subscriptions", { data: null });
    mocks.list.mockResolvedValue({ data: null, error });

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error: "Unable to remove your account files.",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error finding avatar files:",
      error,
    );
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("stops when removing avatar files fails", async () => {
    const error = { message: "Storage deletion failed" };
    db.enqueue("subscriptions", { data: null });
    mocks.list.mockResolvedValue({
      data: [{ name: "user-1-avatar.png" }],
      error: null,
    });
    mocks.remove.mockResolvedValue({ error });

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error: "Unable to remove your account files.",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error deleting avatar files:",
      error,
    );
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("reports an authentication-user deletion failure", async () => {
    const error = { message: "User deletion failed" };
    db.enqueue("subscriptions", { data: null });
    mocks.deleteUser.mockResolvedValue({ error });

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error: "Unable to delete your account.",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error deleting auth user:",
      error,
    );
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("handles unexpected failures during cleanup", async () => {
    const error = new Error("Storage unavailable");
    db.enqueue("subscriptions", { data: null });
    mocks.list.mockRejectedValue(error);

    await expect(deleteAccountAction()).resolves.toEqual({
      success: false,
      error: "Something went wrong deleting your account.",
    });

    expect(console.error).toHaveBeenCalledWith(
      "Unexpected account deletion error:",
      error,
    );
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication failures before cleanup begins", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getAuthenticatedUser.mockRejectedValue(error);

    await expect(deleteAccountAction()).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.storageFrom).not.toHaveBeenCalled();
    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
