import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";
import type { GenerateAchievementsRequest } from "@/lib/ai/types/generate-achievements-request";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  requireAdmin: vi.fn(),
  generate: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/ai/openai", () => ({
  openai: {
    responses: { create: mocks.generate },
  },
}));

import {
  generateAchievementDrafts,
  getAchievementGenerationContext,
} from "@/lib/services/achievement-generator-service-server";

let db: ReturnType<typeof database>;

const request: GenerateAchievementsRequest = {
  packId: "pack-1",
  theme: "Pointless office rituals",
  instructions: "Keep the descriptions short.",
  counts: { common: 1, rare: 0, epic: 0, legendary: 0 },
};

function draft(
  rarity: GeneratedAchievementDraft["rarity"] = "COMMON",
): GeneratedAchievementDraft {
  return {
    title: `Pointless ${rarity} milestone`,
    description: "Another unnecessary accomplishment.",
    rarity,
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
    iconConcept: "A golden paperclip",
    imagePrompt: "A glossy cartoon paperclip badge",
  };
}

function enqueueContext() {
  return db.enqueue("achievements", {
    data: [
      {
        title: "Existing milestone",
        description: "An existing concept.",
      },
    ],
  });
}

function providerReturns(achievements: unknown[]) {
  mocks.generate.mockResolvedValue({
    output_text: JSON.stringify({ achievements }),
  });
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.requireAdmin.mockReset();
  mocks.requireAdmin.mockResolvedValue(undefined);
  mocks.generate.mockReset();
  providerReturns([draft()]);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("achievement generation context", () => {
  it("returns existing non-archived achievements", async () => {
    const query = enqueueContext();

    await expect(getAchievementGenerationContext()).resolves.toEqual([
      {
        title: "Existing milestone",
        description: "An existing concept.",
      },
    ]);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.neq).toHaveBeenCalledWith("status", "archived");
  });

  it("returns an empty list for null context data", async () => {
    db.enqueue("achievements", { data: null });

    await expect(getAchievementGenerationContext()).resolves.toEqual([]);
  });

  it("throws and logs a failed context lookup", async () => {
    const error = { message: "Read failed" };
    db.enqueue("achievements", { error });

    await expect(getAchievementGenerationContext()).rejects.toThrow(
      "Unable to load achievement generation context.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error loading achievement generation context:",
      error,
    );
  });
});

describe("achievement generator authorization", () => {
  it.each([
    {
      name: "context lookup",
      run: () => getAchievementGenerationContext(),
    },
    {
      name: "generation",
      run: () => generateAchievementDrafts(request),
    },
  ])("stops $name when admin authorization fails", async ({ run }) => {
    mocks.requireAdmin.mockRejectedValue(new Error("Access denied"));

    await expect(run()).rejects.toThrow("Access denied");
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});

describe("achievement draft generation", () => {
  it("returns valid drafts and includes request context in the prompt", async () => {
    enqueueContext();
    const generated = [draft()];
    providerReturns(generated);

    await expect(generateAchievementDrafts(request)).resolves.toEqual(
      generated,
    );

    expect(mocks.generate).toHaveBeenCalledOnce();

    const call = mocks.generate.mock.calls[0][0];

    expect(call.input).toContain(request.theme);
    expect(call.input).toContain(request.instructions);
    expect(call.input).toContain("Create exactly 1 achievements.");
    expect(call.input).toContain("Existing milestone: An existing concept.");
    expect(call.text.format).toMatchObject({
      type: "json_schema",
      name: "achievement_generation",
      strict: true,
    });
  });

  it("uses the fallback instructions when none were supplied", async () => {
    enqueueContext();

    await generateAchievementDrafts({
      packId: request.packId,
      theme: request.theme,
      counts: request.counts,
    });

    expect(mocks.generate.mock.calls[0][0].input).toContain(
      "Additional instructions:\nNone",
    );
  });

  it("accepts the requested mix of all four rarities", async () => {
    enqueueContext();
    const generated = [
      draft("COMMON"),
      draft("RARE"),
      draft("EPIC"),
      draft("LEGENDARY"),
    ];
    providerReturns(generated);

    await expect(
      generateAchievementDrafts({
        ...request,
        counts: { common: 1, rare: 1, epic: 1, legendary: 1 },
      }),
    ).resolves.toEqual(generated);
  });

  it.each([
    { rarity: "COMMON" as const, count: "common" as const },
    { rarity: "RARE" as const, count: "rare" as const },
    { rarity: "EPIC" as const, count: "epic" as const },
    { rarity: "LEGENDARY" as const, count: "legendary" as const },
  ])("rejects an incorrect $rarity count", async ({ rarity, count }) => {
    enqueueContext();
    providerReturns([draft(rarity)]);

    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    counts[count] = 2;

    await expect(
      generateAchievementDrafts({
        ...request,
        counts,
      }),
    ).rejects.toThrow(
      "Generated achievement distribution did not match the request.",
    );
  });

  it("rejects an unsupported generated trigger", async () => {
    enqueueContext();
    providerReturns([
      {
        ...draft(),
        triggerType: "unsupported",
      },
    ]);

    await expect(generateAchievementDrafts(request)).rejects.toThrow(
      "Unsupported trigger generated: unsupported",
    );
  });

  it("rejects a generated trigger with invalid configuration", async () => {
    enqueueContext();
    const generated = draft();
    generated.triggerType = "account_age";
    generated.triggerConfig.days = 0;
    providerReturns([generated]);

    await expect(generateAchievementDrafts(request)).rejects.toThrow(
      `Invalid trigger configuration generated for: ${generated.title}`,
    );
  });

  it("accepts a supported trigger with valid configuration", async () => {
    enqueueContext();
    const generated = draft();
    generated.triggerType = "account_age";
    generated.triggerConfig.days = 30;
    providerReturns([generated]);

    await expect(generateAchievementDrafts(request)).resolves.toEqual([
      generated,
    ]);
  });

  it("does not contact the provider when context loading fails", async () => {
    db.enqueue("achievements", {
      error: { message: "Context unavailable" },
    });

    await expect(generateAchievementDrafts(request)).rejects.toThrow(
      "Unable to load achievement generation context.",
    );
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it("propagates a provider failure", async () => {
    enqueueContext();
    mocks.generate.mockRejectedValue(new Error("Provider unavailable"));

    await expect(generateAchievementDrafts(request)).rejects.toThrow(
      "Provider unavailable",
    );
  });

  it("rejects malformed provider JSON", async () => {
    enqueueContext();
    mocks.generate.mockResolvedValue({ output_text: "not JSON" });

    await expect(generateAchievementDrafts(request)).rejects.toThrow(
      SyntaxError,
    );
  });
});
