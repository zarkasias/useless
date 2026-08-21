import { Gem, Sparkles, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Achievement, AchievementType } from "@/lib/supabase";

interface DashboardStatsProps {
  userAchievements: Achievement[];
}

export function DashboardStats({ userAchievements }: DashboardStatsProps) {
  const totalAchievements = userAchievements.length;

  const achievementsByType = userAchievements.reduce(
    (acc, achievement) => {
      acc[achievement.type] = (acc[achievement.type] || 0) + 1;

      return acc;
    },
    {} as Record<AchievementType, number>,
  );

  const rareCount = achievementsByType.RARE || 0;
  const epicCount = achievementsByType.EPIC || 0;
  const legendaryCount = achievementsByType.LEGENDARY || 0;

  const highestRarity =
    legendaryCount > 0
      ? "Legendary"
      : epicCount > 0
        ? "Epic"
        : rareCount > 0
          ? "Rare"
          : totalAchievements > 0
            ? "Common"
            : "None";

  const mostRecentAchievement =
    userAchievements.length > 0
      ? [...userAchievements].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )[0]
      : null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total achievements */}
      <Card className="shadow-sm bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total achievements
              </p>

              <p className="mt-2 text-3xl text-gray-700 font-semibold tracking-tight">
                {totalAchievements}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg">
              <Trophy className="size-5 text-yellow-500" />
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Useless accomplishments collected
          </p>
        </CardContent>
      </Card>

      {/* Highest rarity */}
      <Card className="shadow-sm bg-gray-100">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Highest rarity
              </p>

              <p className="mt-2 text-gray-700 text-2xl font-semibold tracking-tight">
                {highestRarity}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-lg">
              <Gem className="size-5 text-blue-500" />
            </div>
          </div>

          <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
            <span>{rareCount} rare</span>
            <span>·</span>
            <span>{epicCount} epic</span>
            <span>·</span>
            <span>{legendaryCount} legendary</span>
          </div>
        </CardContent>
      </Card>

      {/* Latest achievement */}
      <Card className="shadow-sm bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Latest achievement
              </p>

              <p className="mt-2 text-gray-700 truncate text-lg font-semibold">
                {mostRecentAchievement?.title ?? "None yet"}
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Sparkles className="size-5 text-purple-500" />
            </div>
          </div>

          <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
            {mostRecentAchievement?.description ??
              "Claim your first achievement to get started."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
