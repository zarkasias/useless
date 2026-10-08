import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/services/achievement-generator-service-server", () => ({
  generateAchievementDrafts: vi.fn(),
}));

import { saveGeneratedAchievementDraftAction } from "@/app/admin/achievement-generator/actions";

let db: ReturnType<typeof database>;

const initialState = {
  success: false,
  error: null,
  achievementId: null,
};

const draft = {
  title: "  Professional Procrastinator  ",
  description: "  Eventually.  ",
  rarity: "COMMON",
  emoji: "🏆",
  triggerType: "daily_claim",
  triggerConfig: {
    startHour: null,
    startMinute: null,
    endHour: null,
    endMinute: null,
    month: null,
    day: null,
    days: null,
    count: null,
    rarity: null,
    packSlug: null,
  },
  iconConcept: "  A sleepy trophy  ",
  imagePrompt: "  Draw a sleepy trophy.  ",
};

function makeForm(value: unknown = draft) {
  const form = new FormData();
  form.set("packId", "  pack-1  ");
  form.set("draft", JSON.stringify(value));
  return form;
}

function enqueuePackAndDuplicateCheck() {
  const packQuery = db.enqueue("achievement_packs", {
    data: { id: "pack-1" },
  });
  const duplicateQuery = Object.assign(
    db.enqueue("achievements", { data: null }),
    { ilike: vi.fn().mockReturnThis() },
  );

  return { packQuery, duplicateQuery };
}

function failure(error: string) {
  return {
    success: false,
    error,
    achievementId: null,
  };
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.requireAdmin.mockReset();
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1" });

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("saveGeneratedAchievementDraftAction", () => {
  it.each([
    { triggerType: "daily_claim", isDaily: true },
    { triggerType: "account_age", isDaily: false },
  ])("saves a valid $triggerType draft", async ({ triggerType, isDaily }) => {
    const value = {
      ...draft,
      triggerType,
      triggerConfig: { ...draft.triggerConfig, days: 7 },
    };
    const { packQuery, duplicateQuery } = enqueuePackAndDuplicateCheck();
    const insertQuery = db.enqueue("achievements", {
      data: { id: "achievement-1" },
    });

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm(value)),
    ).resolves.toEqual({
      success: true,
      error: null,
      achievementId: "achievement-1",
    });

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(packQuery.select).toHaveBeenCalledWith("id");
    expect(packQuery.eq).toHaveBeenCalledWith("id", "pack-1");
    expect(duplicateQuery.ilike).toHaveBeenCalledWith(
      "title",
      "Professional Procrastinator",
    );
    expect(insertQuery.insert).toHaveBeenCalledWith({
      title: "Professional Procrastinator",
      description: "Eventually.",
      type: "COMMON",
      emoji: "🏆",
      pack_id: "pack-1",
      status: "draft",
      generated_by: "ai",
      trigger_type: triggerType,
      trigger_config: value.triggerConfig,
      icon_concept: "A sleepy trophy",
      image_prompt: "Draw a sleepy trophy.",
      icon_path: null,
      is_daily: isDaily,
    });
    expect(insertQuery.select).toHaveBeenCalledWith("id");
    expect(insertQuery.single).toHaveBeenCalledOnce();
  });

  it("rejects unauthorized requests before querying the database", async () => {
    const error = new Error("Admin access required");
    mocks.requireAdmin.mockRejectedValue(error);

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm()),
    ).resolves.toEqual(failure("Admin access required"));

    expect(db.from).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Save achievement draft error:",
      error,
    );
  });

  it.each([
    {
      field: "packId",
      expected: "Achievement pack is missing.",
    },
    {
      field: "draft",
      expected: "Achievement draft is missing.",
    },
  ])("rejects missing $field", async ({ field, expected }) => {
    const form = makeForm();
    form.delete(field);

    await expect(
      saveGeneratedAchievementDraftAction(initialState, form),
    ).resolves.toEqual(failure(expected));

    expect(db.from).not.toHaveBeenCalled();
  });

  it("rejects malformed draft JSON", async () => {
    const form = makeForm();
    form.set("draft", "{invalid");

    await expect(
      saveGeneratedAchievementDraftAction(initialState, form),
    ).resolves.toEqual(failure("Achievement draft is invalid."));

    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    { field: "title" },
    { field: "description" },
    { field: "imagePrompt" },
    { field: "iconConcept" },
  ])("rejects a blank $field", async ({ field }) => {
    const value = { ...draft, [field]: "   " };

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm(value)),
    ).resolves.toEqual(failure("Achievement draft is incomplete."));

    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "rarity",
      changes: { rarity: "INVALID" },
      expected: "Achievement rarity is invalid.",
    },
    {
      label: "trigger",
      changes: { triggerType: "unsupported_trigger" },
      expected: "Achievement trigger is not supported.",
    },
    {
      label: "trigger configuration",
      changes: {
        triggerType: "account_age",
        triggerConfig: { ...draft.triggerConfig, days: 0 },
      },
      expected: "Achievement trigger configuration is invalid.",
    },
  ])("rejects invalid $label", async ({ changes, expected }) => {
    await expect(
      saveGeneratedAchievementDraftAction(
        initialState,
        makeForm({ ...draft, ...changes }),
      ),
    ).resolves.toEqual(failure(expected));

    expect(db.from).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing pack", result: { data: null } },
    {
      label: "pack lookup error",
      result: { error: { message: "Lookup failed" } },
    },
  ])("rejects a $label", async ({ result }) => {
    db.enqueue("achievement_packs", result);

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm()),
    ).resolves.toEqual(failure("Achievement pack does not exist."));

    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it("rejects an existing achievement title without inserting", async () => {
    db.enqueue("achievement_packs", { data: { id: "pack-1" } });
    Object.assign(db.enqueue("achievements", { data: { id: "existing-1" } }), {
      ilike: vi.fn().mockReturnThis(),
    });

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm()),
    ).resolves.toEqual(
      failure("An achievement with this title already exists."),
    );

    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it("logs insertion errors and returns a failure", async () => {
    const error = { message: "Insert failed" };
    enqueuePackAndDuplicateCheck();
    db.enqueue("achievements", { error });

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm()),
    ).resolves.toEqual(failure("Unable to save achievement draft."));

    expect(console.error).toHaveBeenCalledWith(
      "Error saving generated achievement draft:",
      error,
    );
  });

  it("uses the fallback message for unexpected non-Error failures", async () => {
    mocks.requireAdmin.mockRejectedValue("Unexpected failure");

    await expect(
      saveGeneratedAchievementDraftAction(initialState, makeForm()),
    ).resolves.toEqual(failure("Unable to save achievement draft."));
  });
});
