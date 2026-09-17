"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { StreakCalendar } from "@/components/dashboard/streak-calendar";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { StreakShareButton } from "@/components/dashboard/streak-share-button";
import { Timezonesync } from "@/components/timezone-sync";
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Trophy, Check, LoaderCircle } from "lucide-react";
import { Achievement, UserProfile } from "@/lib/supabase";

import {
  claimDailyAchievementAction,
  getStreakDataAction,
} from "@/app/actions/achievement-actions";
import type { AchievementStreakData } from "@/lib/services/streak-service-server";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import type { FriendActivityItem } from "@/lib/services/activity-service-server";

import { toast } from "sonner";
import { AchievementCard } from "@/components/achievement-card-updated";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { FeaturedPackPromo } from "@/components/packs/featured-pack-promo";

interface DashboardClientProps {
  initialProfile: UserProfile;
  initialAchievements: Achievement[];
  initialStreakData: AchievementStreakData;
  initialEntitlements: UserEntitlements;
  initialPacks: StoreAchievementPack[];
  initialTriggeredAchievements: Achievement[];
  friendActivity: FriendActivityItem[];
}

export default function DashboardClient({
  initialProfile,
  initialAchievements,
  initialStreakData,
  initialEntitlements,
  initialPacks,
  initialTriggeredAchievements,
  friendActivity,
}: DashboardClientProps) {
  const router = useRouter();
  const [user] = useState<UserProfile | null>(initialProfile);
  const [userAchievements, setUserAchievements] =
    useState<Achievement[]>(initialAchievements);

  const [streakData, setStreakData] =
    useState<AchievementStreakData>(initialStreakData);
  const [achievementQueue, setAchievementQueue] = useState<Achievement[]>(
    initialTriggeredAchievements,
  );

  const activeAchievement = achievementQueue[0] ?? null;
  const [isClaimingAchievement, setIsClaimingAchievement] = useState(false);

  const featuredPack = initialPacks[0];

  const handleDailyAchievement = async () => {
    if (!user || isClaimingAchievement) return;

    try {
      setIsClaimingAchievement(true);
      const result = await claimDailyAchievementAction();

      if (result.status === "already_claimed") {
        toast.info("You've already claimed today's achievement.");
        return;
      }

      if (result.status === "subscription_required") {
        router.push("/pro");
        return;
      }

      if (result.status === "unavailable") {
        toast.info("Today's achievement is unavailable right now.");
        return;
      }

      const achievement = result.achievement;

      const achievementsToShow = [
        achievement,
        ...(result.triggeredAchievements ?? []),
      ].filter((item): item is Achievement =>
        Boolean(item && item.id && item.title && item.description && item.type),
      );

      setAchievementQueue(achievementsToShow);

      setUserAchievements((current) => {
        const existingIds = new Set(
          current.map((achievement) => achievement.id),
        );

        const newAchievements = achievementsToShow.filter(
          (achievement) => !existingIds.has(achievement.id),
        );

        return [...newAchievements, ...current];
      });

      const updatedStreakData = await getStreakDataAction();

      setStreakData(updatedStreakData);

      toast.success("Today's achievement unlocked!");
    } catch (error) {
      console.error("Error claiming daily achievement:", error);
      toast.error("Something went wrong");
    } finally {
      setIsClaimingAchievement(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Timezonesync currentTimezone={initialProfile.timezone} />
      <Navbar
        user={user}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />

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

                      <div className="mt-6 min-w-[260px] justfiy-center inline-flex w-fit items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm font-medium">
                        <Check className="size-5 text-gray-700" />
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
                        disabled={isClaimingAchievement}
                        className="mt-6 
    min-w-[260px] justfiy-center shadow-lg shadow-indigo-500/25 hover:from-violet-500 hover:via-indigo-500 hover:to-blue-400 font-black bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600"
                      >
                        {isClaimingAchievement ? (
                          <>
                            <LoaderCircle className="mr-2 size-5 animate-spin" />
                            Claiming achievement...
                          </>
                        ) : (
                          <>
                            <span className="mr-2 p-0.5">
                              <Image
                                alt="Claim Achievement"
                                width={38}
                                height={38}
                                className="w-8 h-8 bg-transparent -scale-x-100"
                                src="/icons/target.webp"
                              />
                            </span>
                            Claim Today&apos;s Achievement
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>

                {/* Streak footer */}
                <div className="mt-auto grid grid-cols-2 divide-x divide-white/10 bg-gray-600 text-white">
                  <div className="flex flex-col sm:flex-row  sm:items-center sm:justify-between gap-3 sm:gap-0 pl-6 pr-2 py-4">
                    <div className="flex items-center gap-3">
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
                    {streakData.currentStreak > 0 && (
                      <StreakShareButton
                        username={initialProfile.username}
                        currentStreak={streakData.currentStreak}
                      />
                    )}
                  </div>

                  <div className="flex sm:items-center gap-3 px-6 py-4">
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

          {featuredPack && (
            <section className="pt-2">
              <FeaturedPackPromo pack={featuredPack} variant="dashboard" />
            </section>
          )}

          {/* Stats */}
          <section>
            <DashboardStats userAchievements={userAchievements} />
          </section>

          {friendActivity.length > 0 && (
            <section className="pt-2">
              <ActivityFeed friendActivity={friendActivity} />
            </section>
          )}

          {/* Recent Achievements */}
          <section className="space-y-4 pt-2">
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
                href="/collection"
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
                    variant="compact"
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

      {activeAchievement && (
        <UnlockAchievement
          achievement={activeAchievement}
          isOpen={true}
          onClose={() => {
            setAchievementQueue((current) => current.slice(1));
          }}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
}
