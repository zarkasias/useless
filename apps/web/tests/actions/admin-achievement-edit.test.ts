import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    is_daily: "false",
    trigger_type: "",
    ...values,
  })) {
    form.set(key, value);
  }

  return form;
}

function enqueueAchievement(triggerType: string | null = null) {
  return db.enqueue("achievements", {
    data: {
      id: "achievement-1",
      trigger_type: triggerType,
    },
  });
}

function enqueueSuccessfulUpdate() {
  return db.enqueue("achievements", {
    data: { id: "achievement-1" },
  });
}

function expectNoCompletion() {
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
  expect(mocks.redirect).not.toHaveBeenCalled();
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("updateAdminAchievement", () => {
  it("trims required values and saves missing optional fields as null", async () => {
    const lookup = enqueueAchievement();
    const update = enqueueSuccessfulUpdate();

    await expect(updateAdminAchievement(makeForm())).rejects.toBe(
      redirectSignal,
    );

    expect(lookup.select).toHaveBeenCalledWith("id, trigger_type");
    expect(lookup.eq).toHaveBeenCalledWith("id", "achievement-1");
    expect(lookup.maybeSingle).toHaveBeenCalledOnce();

    expect(update.update).toHaveBeenCalledWith({
      title: "An unnecessary accomplishment",
      description: "You did the thing.",
      type: "COMMON",
      emoji: null,
      icon_path: null,
      icon_concept: null,
      image_prompt: null,
      category: null,
      pack_id: null,
      is_daily: false,
      trigger_type: null,
      status: "draft",
    });
    expect(update.eq).toHaveBeenCalledWith("id", "achievement-1");
    expect(update.select).toHaveBeenCalledWith("id");
    expect(update.maybeSingle).toHaveBeenCalledOnce();
    expect(db.from).toHaveBeenCalledTimes(2);

    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin/achievements"],
      ["/admin/achievements/achievement-1"],
    ]);
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/admin/achievements/achievement-1",
    );
  });

  it("validates the selected pack and saves trimmed optional fields", async () => {
    enqueueAchievement();

    const packQuery = db.enqueue("achievement_packs", {
      data: { id: "pack-1" },
    });
    const update = enqueueSuccessfulUpdate();

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
          is_daily: "true",
          trigger_type: "  daily_claim  ",
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
      is_daily: true,
      trigger_type: "daily_claim",
      status: "published",
    });
  });

  it("converts whitespace-only optional fields and trigger to null", async () => {
    enqueueAchievement();
    const update = enqueueSuccessfulUpdate();

    await expect(
      updateAdminAchievement(
        makeForm({
          emoji: "   ",
          icon_path: "   ",
          icon_concept: "   ",
          image_prompt: "   ",
          category: "   ",
          pack_id: "   ",
          trigger_type: "   ",
        }),
      ),
    ).rejects.toBe(redirectSignal);

    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: null,
        icon_path: null,
        icon_concept: null,
        image_prompt: null,
        category: null,
        pack_id: null,
        trigger_type: null,
      }),
    );
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("rejects unauthorized requests before accessing the database", async () => {
    const error = new Error("Admin access required");
    mocks.requireAdmin.mockRejectedValue(error);

    await expect(updateAdminAchievement(makeForm())).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expectNoCompletion();
  });

  describe.each(["id", "title", "description"])("required %s", (field) => {
    it.each(["missing", "blank"])("rejects a %s value", async (kind) => {
      const form = makeForm();

      if (kind === "missing") {
        form.delete(field);
      } else {
        form.set(field, "   ");
      }

      await expect(updateAdminAchievement(form)).rejects.toThrow(
        "Achievement id, title, and description are required.",
      );

      expect(db.from).not.toHaveBeenCalled();
      expectNoCompletion();
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
    {
      field: "is_daily",
      value: "yes",
      message: "Choose whether this is a daily achievement.",
    },
  ])("rejects an invalid $field", async ({ field, value, message }) => {
    await expect(
      updateAdminAchievement(makeForm({ [field]: value })),
    ).rejects.toThrow(message);

    expect(db.from).not.toHaveBeenCalled();
    expectNoCompletion();
  });

  it.each([
    {
      field: "is_daily",
      message: "Choose whether this is a daily achievement.",
    },
    {
      field: "trigger_type",
      message: "Choose an achievement trigger.",
    },
  ])("rejects a missing $field", async ({ field, message }) => {
    const form = makeForm();
    form.delete(field);

    await expect(updateAdminAchievement(form)).rejects.toThrow(message);

    expect(db.from).not.toHaveBeenCalled();
    expectNoCompletion();
  });

  it.each([
    {
      label: "missing achievement",
      result: { data: null },
      message: "Achievement not found.",
    },
    {
      label: "achievement lookup error",
      result: { error: { message: "Lookup failed" } },
      message: "Unable to load achievement.",
    },
  ])("rejects a $label without updating", async ({ result, message }) => {
    const lookup = db.enqueue("achievements", result);

    await expect(updateAdminAchievement(makeForm())).rejects.toThrow(message);

    expect(lookup.update).not.toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(1);
    expectNoCompletion();
  });

  it.each([
    {
      label: "missing pack",
      result: { data: null },
      message: "Selected achievement pack does not exist.",
    },
    {
      label: "pack lookup error",
      result: { error: { message: "Lookup failed" } },
      message: "Unable to validate the selected achievement pack.",
    },
  ])("rejects a $label without updating", async ({ result, message }) => {
    const lookup = enqueueAchievement();
    db.enqueue("achievement_packs", result);

    await expect(
      updateAdminAchievement(makeForm({ pack_id: "pack-1" })),
    ).rejects.toThrow(message);

    expect(lookup.update).not.toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(2);
    expectNoCompletion();
  });

  it("requires an icon when publishing through the edit action", async () => {
    const lookup = enqueueAchievement();

    await expect(
      updateAdminAchievement(makeForm({ status: "published" })),
    ).rejects.toThrow(
      "An achievement must have an icon before it can be published.",
    );

    expect(lookup.update).not.toHaveBeenCalled();
    expect(db.from).toHaveBeenCalledTimes(1);
    expectNoCompletion();
  });

  it("allows archiving without an icon", async () => {
    enqueueAchievement();
    const update = enqueueSuccessfulUpdate();

    await expect(
      updateAdminAchievement(makeForm({ status: "archived" })),
    ).rejects.toBe(redirectSignal);

    expect(update.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "archived",
        icon_path: null,
      }),
    );
  });

  it.each([
    {
      label: "convert a legacy achievement to daily claim",
      existingTrigger: null,
      triggerType: "daily_claim",
      isDaily: "true",
      expectedTrigger: "daily_claim",
    },
    {
      label: "keep a legacy daily achievement",
      existingTrigger: null,
      triggerType: "",
      isDaily: "true",
      expectedTrigger: null,
    },
    {
      label: "keep an existing daily-claim achievement",
      existingTrigger: "daily_claim",
      triggerType: "daily_claim",
      isDaily: "true",
      expectedTrigger: "daily_claim",
    },
    {
      label: "remove daily participation and its trigger",
      existingTrigger: "daily_claim",
      triggerType: "",
      isDaily: "false",
      expectedTrigger: null,
    },
  ])(
    "can $label",
    async ({ existingTrigger, triggerType, isDaily, expectedTrigger }) => {
      enqueueAchievement(existingTrigger);
      const update = enqueueSuccessfulUpdate();

      await expect(
        updateAdminAchievement(
          makeForm({
            is_daily: isDaily,
            trigger_type: triggerType,
          }),
        ),
      ).rejects.toBe(redirectSignal);

      expect(update.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_daily: isDaily === "true",
          trigger_type: expectedTrigger,
        }),
      );

      // Saving the form must not overwrite eligibility conditions.
      const payload = update.update.mock.calls[0][0];
      expect(payload).not.toHaveProperty("trigger_config");
    },
  );

  it.each([
    "streak",
    "account_age",
    "collection_count",
    "game_stat",
    "game_session",
    "manual_award",
  ])(
    "preserves an existing %s trigger during ordinary edits",
    async (trigger) => {
      enqueueAchievement(trigger);
      const update = enqueueSuccessfulUpdate();

      await expect(
        updateAdminAchievement(makeForm({ trigger_type: trigger })),
      ).rejects.toBe(redirectSignal);

      expect(update.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_daily: false,
          trigger_type: trigger,
        }),
      );
    },
  );

  it.each([
    {
      label: "changing an automatic trigger",
      existingTrigger: "streak",
      triggerType: "daily_claim",
      isDaily: "true",
      type: "COMMON",
      message:
        "Automatic and manual-award triggers cannot be changed from this form.",
    },
    {
      label: "clearing a manual-award trigger",
      existingTrigger: "manual_award",
      triggerType: "",
      isDaily: "false",
      type: "SECRET",
      message:
        "Automatic and manual-award triggers cannot be changed from this form.",
    },
    {
      label: "assigning an unsupported trigger",
      existingTrigger: null,
      triggerType: "streak",
      isDaily: "false",
      type: "COMMON",
      message: "Invalid achievement trigger.",
    },
    {
      label: "a daily-claim trigger with Daily set to No",
      existingTrigger: null,
      triggerType: "daily_claim",
      isDaily: "false",
      type: "COMMON",
      message:
        "Set Daily achievement to Yes when using the Daily claim trigger.",
    },
    {
      label: "enabling daily for an automatic award",
      existingTrigger: "collection_count",
      triggerType: "collection_count",
      isDaily: "true",
      type: "COMMON",
      message:
        "Automatic and manual-award achievements cannot enter the daily pool.",
    },
    {
      label: "enabling daily for a game achievement",
      existingTrigger: null,
      triggerType: "daily_claim",
      isDaily: "true",
      type: "GAME",
      message: "Game achievements must remain outside the daily pool.",
    },
  ])(
    "rejects $label",
    async ({ existingTrigger, triggerType, isDaily, type, message }) => {
      const lookup = enqueueAchievement(existingTrigger);

      await expect(
        updateAdminAchievement(
          makeForm({
            trigger_type: triggerType,
            is_daily: isDaily,
            type,
          }),
        ),
      ).rejects.toThrow(message);

      expect(lookup.update).not.toHaveBeenCalled();
      expect(db.from).toHaveBeenCalledTimes(1);
      expectNoCompletion();
    },
  );

  it("logs update failures without revalidating or redirecting", async () => {
    enqueueAchievement();

    const error = { message: "Update failed" };
    db.enqueue("achievements", { error });

    await expect(updateAdminAchievement(makeForm())).rejects.toThrow(
      "Unable to update achievement.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error updating achievement:",
      error,
    );
    expectNoCompletion();
  });

  it("rejects an update that returns no achievement", async () => {
    enqueueAchievement();
    db.enqueue("achievements", { data: null });

    await expect(updateAdminAchievement(makeForm())).rejects.toThrow(
      "Achievement no longer exists.",
    );

    expectNoCompletion();
  });
});
