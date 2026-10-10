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

import {
  archiveAdminAchievement,
  publishAdminAchievement,
  returnAchievementToDraft,
} from "@/app/admin/achievements/actions";

let db: ReturnType<typeof database>;
const redirectSignal = new Error("Redirect");

const achievement = {
  id: "achievement-1",
  title: "An unnecessary accomplishment",
  description: "You did the thing.",
  icon_path: "/icons/trophy.png",
  trigger_type: "daily_claim",
  trigger_config: {},
};

function makeForm(id: string | undefined = "  achievement-1  ") {
  const form = new FormData();

  if (id !== undefined) {
    form.set("id", id);
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

const actions = [
  {
    name: "publishAdminAchievement",
    run: publishAdminAchievement,
    status: "published",
    loadsAchievement: true,
    error: "Unable to publish achievement.",
    log: "Error publishing achievement:",
  },
  {
    name: "archiveAdminAchievement",
    run: archiveAdminAchievement,
    status: "archived",
    loadsAchievement: false,
    error: "Unable to archive achievement.",
    log: "Error archiving achievement:",
  },
  {
    name: "returnAchievementToDraft",
    run: returnAchievementToDraft,
    status: "draft",
    loadsAchievement: false,
    error: "Unable to return achievement to draft.",
    log: "Error returning achievement to draft:",
  },
];

describe.each(actions)("$name", (testCase) => {
  it("updates the status and redirects after revalidating pages", async () => {
    if (testCase.loadsAchievement) {
      const lookup = db.enqueue("achievements", {
        data: achievement,
      });

      // Assertions follow the action call below.
      expect(lookup.single).not.toHaveBeenCalled();
    }

    const update = db.enqueue("achievements", {});

    await expect(testCase.run(makeForm())).rejects.toBe(redirectSignal);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(update.update).toHaveBeenCalledWith({
      status: testCase.status,
    });
    expect(update.eq).toHaveBeenCalledWith("id", "achievement-1");

    if (testCase.loadsAchievement) {
      expect(db.queries[0].eq).toHaveBeenCalledWith("id", "achievement-1");
      expect(db.queries[0].single).toHaveBeenCalledOnce();
    }

    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin/achievements"],
      ["/admin/achievements/achievement-1"],
    ]);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/admin/achievements/achievement-1",
    );
    expect(mocks.revalidatePath.mock.invocationCallOrder[1]).toBeLessThan(
      mocks.redirect.mock.invocationCallOrder[0],
    );
  });

  it("rejects unauthorized requests before querying data", async () => {
    const error = new Error("Admin access required");
    mocks.requireAdmin.mockRejectedValue(error);

    await expect(testCase.run(makeForm())).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing", id: undefined },
    { label: "blank", id: "   " },
  ])("rejects a $label achievement ID", async ({ id }) => {
    const form = new FormData();

    if (id !== undefined) {
      form.set("id", id);
    }

    await expect(testCase.run(form)).rejects.toThrow(
      "Achievement id is required.",
    );

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("logs update errors without revalidating or redirecting", async () => {
    if (testCase.loadsAchievement) {
      db.enqueue("achievements", { data: achievement });
    }

    const error = { message: "Update failed" };
    db.enqueue("achievements", { error });

    await expect(testCase.run(makeForm())).rejects.toThrow(testCase.error);

    expect(console.error).toHaveBeenCalledWith(testCase.log, error);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("publishAdminAchievement validation", () => {
  it.each([
    { label: "missing achievement", result: { data: null } },
    {
      label: "lookup error",
      result: { error: { message: "Lookup failed" } },
    },
  ])("rejects a $label", async ({ result }) => {
    db.enqueue("achievements", result);

    await expect(publishAdminAchievement(makeForm())).rejects.toThrow(
      "Unable to load achievement.",
    );

    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    {
      field: "title",
      message:
        "Achievement requires a title and description before publishing.",
    },
    {
      field: "description",
      message:
        "Achievement requires a title and description before publishing.",
    },
    {
      field: "icon_path",
      message: "Achievement requires an icon before publishing.",
    },
    {
      field: "trigger_type",
      message: "Achievement requires a trigger before publishing.",
    },
  ])(
    "rejects a missing $field without updating",
    async ({ field, message }) => {
      db.enqueue("achievements", {
        data: { ...achievement, [field]: null },
      });

      await expect(publishAdminAchievement(makeForm())).rejects.toThrow(
        message,
      );

      expect(db.from).toHaveBeenCalledTimes(1);
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
