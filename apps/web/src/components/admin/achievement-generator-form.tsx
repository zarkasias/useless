"use client";

import { useActionState } from "react";
import { generateAchievementsAction } from "@/app/admin/achievement-generator/actions";
import type { AchievementGeneratorState } from "@/lib/ai/types/achievement-generator-state";
import { GeneratedAchievementCard } from "@/components/admin/generated-achievement-card";
import type { AchievementPack } from "@/lib/types/achievement-pack";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: AchievementGeneratorState = {
  success: false,
  error: null,
  packId: null,
  achievements: [],
};

export function AchievementGeneratorForm({
  packs,
}: {
  packs: AchievementPack[];
}) {
  const [state, formAction, pending] = useActionState(
    generateAchievementsAction,
    initialState,
  );

  const packId = state.packId;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-700">
            Generate Achievement Drafts
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="packId">Achievement pack</Label>

              <select
                id="packId"
                name="packId"
                required
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Select a pack</option>
                {packs.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                name="theme"
                placeholder="Evergreen useless internet habits"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Additional instructions</Label>

              <Textarea
                id="instructions"
                name="instructions"
                rows={5}
                placeholder="Avoid seasonal references. Keep the tone playful and globally understandable."
              />
            </div>

            <div>
              <Label>Rarity distribution</Label>

              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="common">Common</Label>
                  <Input
                    id="common"
                    name="common"
                    type="number"
                    min="0"
                    defaultValue="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="common">Rare</Label>
                  <Input
                    id="rare"
                    name="rare"
                    type="number"
                    min="0"
                    defaultValue="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="common">Epic</Label>
                  <Input
                    id="epic"
                    name="epic"
                    type="number"
                    min="0"
                    defaultValue="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="common">Legendary</Label>
                  <Input
                    id="legendary"
                    name="legendary"
                    type="number"
                    min="0"
                    defaultValue="2"
                  />
                </div>
              </div>
            </div>

            {state.error && (
              <p className="text-sm font-medium text-red-500">{state.error}</p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="w-full bg-gray-800"
            >
              {pending ? "Generating achievements..." : "Generate Drafts"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.achievements.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-gray-700">Generated Drafts</h2>

            <p className="text-sm text-muted-foreground">
              Nothing has been saved yet.
            </p>
          </div>

          {packId && (
            <div className="grid gap-4 md:grid-cols-2">
              {state.achievements.map((achievement, index) => (
                <GeneratedAchievementCard
                  key={`${achievement.title}-${index}`}
                  achievement={achievement}
                  packId={packId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
