"use client";

import { useActionState } from "react";

import { saveGeneratedAchievementDraftAction } from "@/app/admin/achievement-generator/actions";

import type { GeneratedAchievementDraft } from "@/lib/ai/types/generated-achievement";
import type { SaveAchievementDraftState } from "@/lib/ai/types/save-achievement-draft-state";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";

const initialState: SaveAchievementDraftState = {
  success: false,
  error: null,
  achievementId: null,
};

export function GeneratedAchievementCard({
  achievement,
  packId,
}: {
  achievement: GeneratedAchievementDraft;
  packId: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveGeneratedAchievementDraftAction,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-3xl">{achievement.emoji}</div>

            <CardTitle className="mt-2">{achievement.title}</CardTitle>
          </div>

          <span className="rounded-full border px-3 py-1 text-xs font-bold">
            {achievement.rarity}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {achievement.description}
        </p>

        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Trigger
          </p>

          <p className="mt-1 text-sm font-semibold">
            {achievement.triggerType}
          </p>

          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(achievement.triggerConfig, null, 2)}
          </pre>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Icon concept
          </p>

          <p className="mt-1 text-sm">{achievement.iconConcept}</p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Image prompt
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {achievement.imagePrompt}
          </p>
        </div>

        <form action={formAction}>
          <input type="hidden" name="packId" value={packId} />

          <input
            type="hidden"
            name="draft"
            value={JSON.stringify(achievement)}
          />

          <Button
            type="submit"
            disabled={pending || state.success}
            className="w-full"
          >
            {pending ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Saving draft...
              </>
            ) : state.success ? (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Draft saved
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Draft
              </>
            )}
          </Button>
        </form>

        {state.error && (
          <p className="text-sm font-medium text-red-500">{state.error}</p>
        )}

        {state.success && (
          <p className="text-sm font-medium text-green-600">
            Saved to the achievement database.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
