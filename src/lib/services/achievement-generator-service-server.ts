import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth/require-admin";

import { openai } from "@/lib/ai/openai";

import type { GenerateAchievementsRequest } from "@/lib/ai/types/generate-achievements-request";

import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";

import { isSupportedTrigger } from "@/lib/achievements/validate-trigger";
import { validateTriggerConfig } from "@/lib/achievements/validate-trigger-config";

import {
  ACHIEVEMENT_TRIGGERS,
  ACHIEVEMENT_TRIGGER_DESCRIPTIONS,
} from "@/lib/achievements/trigger-registry";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export async function getAchievementGenerationContext() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin
    .from("achievements")
    .select(
      `
      title,
      description,
      type,
      trigger_type,
      trigger_config,
      pack_id
    `,
    )
    .neq("status", "archived");

  if (error) {
    console.error("Error loading achievement generation context:", error);

    throw new Error("Unable to load achievement generation context.");
  }

  return data ?? [];
}

export async function generateAchievementDrafts(
  request: GenerateAchievementsRequest,
): Promise<GeneratedAchievementDraft[]> {
  await requireAdmin();

  const existingAchievements = await getAchievementGenerationContext();

  const supportedTriggers = Object.values(ACHIEVEMENT_TRIGGERS);

  const totalCount =
    request.counts.common +
    request.counts.rare +
    request.counts.epic +
    request.counts.legendary;

  const prompt = `
You are generating achievement content for a product called
"Useless Achievements".

The product tone is:
- playful
- ridiculous
- useless
- clever
- lighthearted
- not mean-spirited
- globally understandable where possible

You MUST avoid duplicating existing achievement concepts.

You MUST ONLY use these supported trigger types:

${supportedTriggers
  .map(
    (trigger) => `- ${trigger}: ${ACHIEVEMENT_TRIGGER_DESCRIPTIONS[trigger]}`,
  )
  .join("\n")}

Trigger configuration rules:

daily_claim:
- all triggerConfig fields must be null

login_time:
- use startHour, startMinute, endHour, endMinute
- hours use 0-23
- minutes use 0-59
- all other fields null

login_date:
- use month and day
- all other fields null

consecutive_days:
- use days
- all other fields null

achievement_count:
- use count
- all other fields null

rarity_count:
- use rarity and count
- all other fields null

pack_completion:
- use packSlug
- all other fields null

account_age:
- use days
- all other fields null

Requested theme:
${request.theme}

Additional instructions:
${request.instructions ?? "None"}

Create exactly ${totalCount} achievements.

Required rarity distribution:
COMMON: ${request.counts.common}
RARE: ${request.counts.rare}
EPIC: ${request.counts.epic}
LEGENDARY: ${request.counts.legendary}

Existing achievements to avoid duplicating:

${existingAchievements
  .map((achievement) => `- ${achievement.title}: ${achievement.description}`)
  .join("\n")}

For each achievement provide:
- title
- short funny description
- rarity
- emoji
- supported trigger type
- machine-readable trigger configuration

For triggerConfig:
- Always return every triggerConfig field.
- Set unused fields to null.
- Never put explanatory prose in triggerConfig.

- icon concept
- image generation prompt

The image prompt MUST describe:
- one standalone achievement icon
- transparent background
- 1:1 composition
- polished glossy 3D cartoon game-badge style
- bold centered silhouette
- no square background
- no unnecessary text
- rarity-appropriate visual intensity
`;

  const response = await openai.responses.create({
    model: "gpt-5.6-terra",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "achievement_generation",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            achievements: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: {
                    type: "string",
                  },
                  description: {
                    type: "string",
                  },
                  rarity: {
                    type: "string",
                    enum: ["COMMON", "RARE", "EPIC", "LEGENDARY"],
                  },
                  emoji: {
                    type: "string",
                  },
                  triggerType: {
                    type: "string",
                    enum: supportedTriggers,
                  },
                  triggerConfig: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      startHour: {
                        type: ["integer", "null"],
                      },
                      startMinute: {
                        type: ["integer", "null"],
                      },
                      endHour: {
                        type: ["integer", "null"],
                      },
                      endMinute: {
                        type: ["integer", "null"],
                      },
                      month: {
                        type: ["integer", "null"],
                      },
                      day: {
                        type: ["integer", "null"],
                      },
                      days: {
                        type: ["integer", "null"],
                      },
                      count: {
                        type: ["integer", "null"],
                      },
                      rarity: {
                        type: ["string", "null"],
                        enum: ["COMMON", "RARE", "EPIC", "LEGENDARY", null],
                      },
                      packSlug: {
                        type: ["string", "null"],
                      },
                    },
                    required: [
                      "startHour",
                      "startMinute",
                      "endHour",
                      "endMinute",
                      "month",
                      "day",
                      "days",
                      "count",
                      "rarity",
                      "packSlug",
                    ],
                  },
                  iconConcept: {
                    type: "string",
                  },
                  imagePrompt: {
                    type: "string",
                  },
                },
                required: [
                  "title",
                  "description",
                  "rarity",
                  "emoji",
                  "triggerType",
                  "triggerConfig",
                  "iconConcept",
                  "imagePrompt",
                ],
              },
            },
          },
          required: ["achievements"],
        },
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as {
    achievements: GeneratedAchievementDraft[];
  };

  if (!validateDistribution(parsed.achievements, request)) {
    throw new Error(
      "Generated achievement distribution did not match the request.",
    );
  }

  for (const achievement of parsed.achievements) {
    if (!isSupportedTrigger(achievement.triggerType)) {
      throw new Error(
        `Unsupported trigger generated: ${achievement.triggerType}`,
      );
    }

    if (!validateTriggerConfig(achievement)) {
      throw new Error(
        `Invalid trigger configuration generated for: ${achievement.title}`,
      );
    }
  }

  return parsed.achievements;
}

function validateDistribution(
  achievements: GeneratedAchievementDraft[],
  request: GenerateAchievementsRequest,
) {
  const counts = {
    common: achievements.filter((item) => item.rarity === "COMMON").length,

    rare: achievements.filter((item) => item.rarity === "RARE").length,

    epic: achievements.filter((item) => item.rarity === "EPIC").length,

    legendary: achievements.filter((item) => item.rarity === "LEGENDARY")
      .length,
  };

  return (
    counts.common === request.counts.common &&
    counts.rare === request.counts.rare &&
    counts.epic === request.counts.epic &&
    counts.legendary === request.counts.legendary
  );
}
