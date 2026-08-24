"use client";

import { Navbar } from "@/components/navbar";

import { AchievementsGrid } from "@/components/dashboard/achievements-grid";

import { Achievement, UserProfile } from "@/lib/supabase";

interface AchievementClientProps {
  initialProfile: UserProfile;
  initialAchievements: Achievement[];
}

export default function AchievementsClient({
  initialProfile,
  initialAchievements,
}: AchievementClientProps) {
  const user = initialProfile;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar user={user} />

      <main className="mx-auto w-full mx-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header>
            <p className="text-sm font-medium text-muted-foreground">
              Collection
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-700 sm:text-4xl">
              Your Achievements
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Every completely unnecessary accomplishment you&apos;ve collected
              so far.
            </p>
          </header>

          <div className="flex items-center justify-between border-b pb-4">
            <p className="text-sm text-mutes-foreground">
              <span className="font-semibold text-gray-700">
                {initialAchievements.length}
              </span>{" "}
              achievement
              {initialAchievements.length === 1 ? "" : "s"} collected
            </p>
          </div>
          <div className="rounded-lg border bg-background p-4 shadow-sm sm:p-6">
            <AchievementsGrid achievements={initialAchievements} />
          </div>
        </div>
      </main>
    </div>
  );
}
