"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { AchievementsGrid } from "@/components/dashboard/achievements-grid";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { Button } from "@/components/ui/button";
import { Achievement, UserProfile } from "@/lib/supabase";

import {
  claimDailyAchievementAction,
  getStreakDataAction,
} from "@/app/actions/achievement-actions";
import type { AchievementStreakData } from "@/lib/achievement-service-server";

import { toast } from "sonner";
import { logout } from "@/lib/auth-actions";

interface DashboardClientProps {
  initialProfile: UserProfile;
  initialAchievements: Achievement[];
  initialStreakData: AchievementStreakData;
}

export default function DashboardClient({
  initialProfile,
  initialAchievements,
  initialStreakData,
}: DashboardClientProps) {
  const [user] = useState<UserProfile | null>(initialProfile);
  const [userAchievements, setUserAchievements] =
    useState<Achievement[]>(initialAchievements);

  const [streakData, setStreakData] =
    useState<AchievementStreakData>(initialStreakData);
  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleDailyAchievement = async () => {
    if (!user) return;

    try {
      const achievement = await claimDailyAchievementAction();

      if (!achievement) {
        toast.info("You've already claimed today's achievement.");
        return;
      }

      setUnlockedAchievement(achievement);
      setShowAchievementModal(true);

      setUserAchievements((current) => [achievement, ...current]);

      const updatedStreakData = await getStreakDataAction();

      setStreakData(updatedStreakData);

      toast.success("Today's achievement unlocked!");
    } catch (error) {
      console.error("Error claiming daily achievement:", error);

      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {/* Header */}
          <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Welcome back
              </p>

              <h1 className="text-2xl font-bold text-gray-700 tracking-tight sm:text-4xl">
                {user?.username ?? "Your Dashboard"}
              </h1>

              <p className="mt-1 max-w-xl text-muted-foreground">
                Keep your streak alive, grow your collection, and continue
                accomplishing absolutely nothing useful.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-sm">
              <span className="text-lg">🔥</span>

              <span className="text-sm text-gray-700 font-medium">
                {streakData.currentStreak} day
                {streakData.currentStreak === 1 ? "" : "s"} streak
              </span>
            </div>
          </section>

          {/* Today's Achievement */}
          <section className="overflow-hidden rounded-l border bg-background shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_0.6fr]">
              <div className="p-6">
                <div className="mb-3 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  Today
                </div>

                {streakData.claimedToday ? (
                  <>
                    <h2 className="text-2xl text-gray-700 font-semibold tracking-tight">
                      You&apos;re done for today
                    </h2>

                    <p className="mt-2 max-w-lg text-muted-foreground">
                      Today&apos;s useless achievement is safely in your
                      collection. Come back tomorrow to keep your streak going.
                    </p>

                    <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-medium">
                      <span>✓</span>
                      Achievement claimed
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl text-gray-700 font-semibold tracking-tight">
                      Today&apos;s achievement is waiting
                    </h2>

                    <p className="mt-2 max-w-lg text-muted-foreground">
                      Claim one new achievement today and keep your streak
                      alive.
                    </p>

                    <Button
                      onClick={handleDailyAchievement}
                      size="lg"
                      className="mt-6"
                    >
                      <span className="mr-2">🎯</span>
                      Claim Today&apos;s Achievement
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-center border-t bg-muted/40 p-8 lg:border-l lg:border-t-0">
                <div className="text-center">
                  <div className="text-5xl text-gray-700 font-bold tracking-tight">
                    {streakData.currentStreak}
                  </div>

                  <div className="mt-1 text-sm font-medium text-muted-foreground">
                    Current streak
                  </div>

                  <div className="mt-5 border-t pt-5">
                    <div className="text-2xl text-gray-800 font-semibold">
                      {streakData.longestStreak}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Best streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section>
            <DashboardStats userAchievements={userAchievements} />
          </section>

          {/* Achievement Collection */}
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl text-gray-700 font-semibold tracking-tight">
                  Your achievements{" "}
                  <span className="-mt-[1px] text-[16px] text-muted-foreground">
                    ({userAchievements.length})
                  </span>
                </h2>
              </div>
            </div>

            <div className="rounded-l border bg-background p-4 shadow-sm sm:p-6">
              <AchievementsGrid achievements={userAchievements} />
            </div>
          </section>
        </div>
      </main>

      <UnlockAchievement
        achievement={unlockedAchievement}
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        isLoggedIn={!!user}
      />
    </div>
  );
}
