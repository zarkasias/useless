import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  requireAdmin: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { updateAdminAchievement } from "@/app/admin/achievements/actions";

let db: ReturnType<typeof database>;
const redirectSignal = new Error("Redirect");

function makeForm(values: Record<string, string> = {}) {
  const form = new FormData();

  for (const [key, value] of Object.entries({
    id: "  achievement-1  ",
    title: "  An unnecessary accomplishment  ",
    description: "  You did the thing.  ",
    type: "  COMMON  ",
    status: "  draft  ",
    ...values,
  })) {
    form.set(key, value);
  }

  return form;
}

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });
  mocks.redirect.mockImplementation(() => {
    throw redirectSignal;
  });

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("updateAdminAchievement", () => {
  it("trims required values and saves missing optional fields as null", async () => {
    const query = db.enqueue("achievements", {});

    await expect(updateAdminAchievement(makeForm())).rejects.toBe(
      redirectSignal,
    );

    expect(query.update).toHaveBeenCalledWith({
      title: "An unnecessary accomplishment",
      description: "You did the thing.",
      type: "COMMON",
      emoji: null,
      icon_path: null,
      icon_concept: null,
      image_prompt: null,
      category: null,
      pack_id: null,
      status: "draft",
    });
    expect(query.eq).toHaveBeenCalledWith("id", "achievement-1");
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin/achievements"],
      ["/admin/achievements/achievement-1"],
    ]);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/admin/achievements/achievement-1",
    );
  });

  it("validates the selected pack and saves trimmed optional fields", async () => {
    const packQuery = db.enqueue("achievement_packs", {
      data: { id: "pack-1" },
    });
    const update = db.enqueue("achievements", {});

    await expect(
      updateAdminAchievement(
        makeForm({
          emoji: "  🏆  ",
          icon_path: "  /icons/trophy.png  ",
          icon_concept: "  A trophy  ",
          image_prompt: "  Draw a trophy.  ",
          category: "  everyday  ",
          pack_id: "  pack-1  ",
          status: "  published  ",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(packQuery.select).toHaveBeenCalledWith("id");
    expect(packQuery.eq).toHaveBeenCalledWith("id", "pack-1");
    expect(packQuery.maybeSingle).toHaveBeenCalledOnce();
    expect(update.update).toHaveBeenCalledWith({
      title: "An unnecessary accomplishment",
      description: "You did the thing.",
      type: "COMMON",
      emoji: "🏆",
      icon_path: "/icons/trophy.png",
      icon_concept: "A trophy",
      image_prompt: "Draw a trophy.",
      category: "everyday",
      pack_id: "pack-1",
      status: "published",
    });
  });

  it("converts whitespace-only optional fields to null", async () => {
    const query = db.enqueue("achievements", {});

    await expect(
      updateAdminAchievement(
        makeForm({
          emoji: "   ",
          icon_path: "   ",
          icon_concept: "   ",
          image_prompt: "   ",
          category: "   ",
          pack_id: "   ",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: null,
        icon_path: null,
        icon_concept: null,
        image_prompt: null,
        category: null,
        pack_id: null,
      }),
    );
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthorized requests before accessing the database", async () => {
    const error = new Error("Admin access required");
    mocks.requireAdmin.mockRejectedValue(error);

    await expect(updateAdminAchievement(makeForm())).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  describe.each([
    { field: "id" },
    { field: "title" },
    { field: "description" },
  ])("required $field", ({ field }) => {
    it.each([
      { label: "missing", value: undefined },
      { label: "blank", value: "   " },
    ])("rejects a $label value", async ({ value }) => {
      const form = makeForm();

      if (value === undefined) {
        form.delete(field);
      } else {
        form.set(field, value);
      }

      await expect(updateAdminAchievement(form)).rejects.toThrow(
        "Achievement id, title, and description are required.",
      );

      expect(db.from).not.toHaveBeenCalled();
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    });
  });

  it.each([
    {
      field: "type",
      value: "INVALID",
      message: "Invalid achievement rarity.",
    },
    {
      field: "category",
      value: "INVALID",
      message: "Invalid achievement category.",
    },
    {
      field: "status",
      value: "INVALID",
      message: "Invalid achievement status.",
    },
  ])("rejects an invalid $field", async ({ field, value, message }) => {
    await expect(
      updateAdminAchievement(makeForm({ [field]: value })),
    ).rejects.toThrow(message);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing pack", result: { data: null } },
    {
      label: "pack lookup error",
      result: { error: { message: "Lookup failed" } },
    },
  ])("rejects a $label without updating", async ({ result }) => {
    db.enqueue("achievement_packs", result);

    await expect(
      updateAdminAchievement(makeForm({ pack_id: "pack-1" })),
    ).rejects.toThrow("Selected achievement pack does not exist.");

    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("requires an icon when publishing through the edit action", async () => {
    await expect(
      updateAdminAchievement(makeForm({ status: "published" })),
    ).rejects.toThrow(
      "An achievement must have an icon before it can be published.",
    );

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("allows archiving without an icon", async () => {
    const query = db.enqueue("achievements", {});

    await expect(
      updateAdminAchievement(makeForm({ status: "archived" })),
    ).rejects.toBe(redirectSignal);

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "archived",
        icon_path: null,
      }),
    );
  });

  it("logs update failures without revalidating or redirecting", async () => {
    const error = { message: "Update failed" };
    db.enqueue("achievements", { error });

    await expect(updateAdminAchievement(makeForm())).rejects.toThrow(
      "Unable to update achievement.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error updating achievement:",
      error,
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
