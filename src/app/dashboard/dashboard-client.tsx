"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { StreakCalendar } from "@/components/dashboard/streak-calendar";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import { Achievement, UserProfile } from "@/lib/supabase";

import {
  claimDailyAchievementAction,
  getStreakDataAction,
} from "@/app/actions/achievement-actions";
import type { AchievementStreakData } from "@/lib/services/achievement-service-server";

import { toast } from "sonner";
import { AchievementCard } from "@/components/achievement-card";

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
      <Navbar user={user} />

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

              <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                Keep your streak alive, grow your collection, and continue
                accomplishing absolutely nothing useful.
              </p>
            </div>
          </section>

          {/* Today's Achievement */}
          <section className="overflow-hidden rounded-lg border bg-background shadow-sm">
            <div className="grid gap-2 lg:grid-cols-[1.5fr_0.85fr]">
              <div className="flex h-full flex-col border-r">
                {/* Main content */}
                <div className="p-4">
                  <div className="mb-3 inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Today ·{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  {streakData.claimedToday ? (
                    <>
                      <h2 className="text-2xl font-semibold tracking-tight text-gray-700">
                        You&apos;re done for today
                      </h2>

                      <p className="mt-2 max-w-lg text-muted-foreground">
                        Today&apos;s useless achievement is safely in your
                        collection. Come back tomorrow to keep your streak
                        going.
                      </p>

                      <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-medium">
                        <span>✓</span>
                        Achievement claimed
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold tracking-tight text-gray-700">
                        Today&apos;s achievement is waiting
                      </h2>

                      <p className="mt-2 max-w-lg text-muted-foreground">
                        Claim one new achievement today and keep your streak
                        alive.
                      </p>

                      <Button
                        onClick={handleDailyAchievement}
                        size="lg"
                        className="mt-6 bg-gray-700"
                      >
                        <span className="mr-2">🎯</span>
                        Claim Today&apos;s Achievement
                      </Button>
                    </>
                  )}
                </div>

                {/* Streak footer */}
                <div className="mt-auto grid grid-cols-2 divide-x divide-white/10 bg-gray-600 text-white">
                  <div className="flex items-center gap-3 px-6 py-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-400/80">
                      <Flame className="size-4 text-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-lg font-semibold leading-none">
                        {streakData.currentStreak}
                      </div>

                      <div className="mt-1 text-xs font-bold text-slate-300">
                        Current streak
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-6 py-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/80">
                      <Trophy className="size-4 text-white" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-lg font-semibold leading-none">
                        {streakData.longestStreak}
                      </div>

                      <div className="mt-1 text-xs font-bold text-slate-300">
                        Best streak
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t bg-slate-100/70 dark:bg-slate-900/30 p-4 lg:border-l lg:border-t-0">
                <StreakCalendar
                  achievementDates={streakData.achievementDates}
                />
              </div>
            </div>
          </section>

          {/* Stats */}
          <section>
            <DashboardStats userAchievements={userAchievements} />
          </section>

          {/* Recent Achievements */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="sm:text-2xl text-gray-700 font-semibold tracking-tight">
                  Recent achievements
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your latest completely unnecessary accomplishments.
                </p>
              </div>

              <Link
                href="/achievements"
                className="group flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
              >
                View all
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {userAchievements.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-3">
                {userAchievements.slice(0, 3).map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    ingrid={true}
                    showShareButton={false}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-background p-8 text-center shadow-sm">
                <Trophy className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 font-medium text-gray-700">
                  No achievements yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Claim your first achievement to start your collection.
                </p>
              </div>
            )}
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
