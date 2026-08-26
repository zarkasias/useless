"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Flame, Medal, Sparkles, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { AchievementCard } from "@/components/achievement-card-updated";

import { Achievement, UserProfile } from "@/lib/supabase";
import { claimDailyAchievementAction } from "@/app/actions/achievement-actions";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import { toast } from "sonner";

interface HomeClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
}

const previewAchievements: Achievement[] = [
  {
    id: "preview-rare",
    user_id: "preview",
    title: "Digital Explorer",
    description:
      "Found this website when you could be doing literally anything else.",
    type: "RARE",
    emoji: "🧠",
    created_at: "2026-01-01T00:00:00.000Z",
    is_daily: true,
  },
  {
    id: "preview-legendary",
    user_id: "preview",
    title: "Achievement Hoarder",
    description:
      "Returned often enough to turn completely useless progress into a lifestyle.",
    type: "LEGENDARY",
    emoji: "🏆",
    created_at: "2026-01-01T00:00:00.000Z",
    is_daily: true,
  },
];

export default function HomeClient({
  initialProfile,
  initialEntitlements,
}: HomeClientProps) {
  const router = useRouter();
  const user = initialProfile;

  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const handleGetDailyAchievement = async () => {
    try {
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
        toast.error("Today's achievement is unavailable right now.");
        return;
      }

      setUnlockedAchievement(result.achievement);
      setShowAchievementModal(true);
      toast.success("Today's achievement unlocked!");
    } catch (error) {
      console.error("Error claiming daily achievement:", error);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar
        user={user}
        isSubscribed={initialEntitlements?.isSubscribed ?? false}
        subscriptionStatus={initialEntitlements?.subscriptionStatus ?? null}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background via-primary/5 to-blue-500/10 px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-10 top-1/4 size-32 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-1/4 left-10 size-48 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 size-64 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-violet-500" />
              Five achievements free. Unlimited uselessness after that.
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-800 sm:text-5xl lg:text-6xl">
              Accomplish absolutely{" "}
              <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                nothing useful.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Claim a new achievement each day, build your streak, grow a
              collection of ridiculous digital awards, and compete for a spot on
              the leaderboard.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={handleGetDailyAchievement}
                className="group border-0 bg-gradient-to-r from-primary to-blue-500 text-white shadow-md transition-all duration-300 hover:opacity-90"
              >
                <Image
                  src="/icons/trophy.png"
                  alt=""
                  width={26}
                  height={26}
                  className="mr-2 size-[26px]"
                />
                Claim today&apos;s achievement
              </Button>

              {!user ? (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signup">Create a free account</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/collection">View your collection</Link>
                </Button>
              )}
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Start free with 5 achievements. Subscribe whenever you want to
              keep collecting.
            </p>
          </div>

          {/* Live preview using the real AchievementCard component */}
          <div className="relative mx-auto w-full max-w-md px-4 py-8">
            <div className="relative z-20 rotate-2 transition-transform duration-300 hover:rotate-0">
              <AchievementCard
                achievement={previewAchievements[0]}
                ingrid
                variant="default"
              />
            </div>

            <div className="relative z-10 -mt-6 ml-8 -rotate-2 opacity-90 transition-transform duration-300 hover:rotate-0 sm:ml-12">
              <AchievementCard
                achievement={previewAchievements[1]}
                ingrid
                variant="default"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product value */}
      <section className="bg-background px-4 py-20">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">
              Pointless progress, properly tracked
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
              More than a daily button
            </h2>

            <p className="mt-3 text-muted-foreground">
              Your daily claim now feeds a streak, a growing collection, and a
              leaderboard designed for people who take useless accomplishments
              far too seriously.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<CalendarDays className="size-5 text-blue-500" />}
              title="Claim daily"
              description="Unlock one new achievement each day and discover what completely unnecessary award you earned."
            />

            <FeatureCard
              icon={<Flame className="size-5 text-orange-500" />}
              title="Build a streak"
              description="Come back every day, protect your current streak, and keep an eye on your personal best."
            />

            <FeatureCard
              icon={<Trophy className="size-5 text-amber-500" />}
              title="Grow your collection"
              description="Collect Common, Rare, Epic, and Legendary achievements in one dedicated collection."
            />

            <FeatureCard
              icon={<Medal className="size-5 text-violet-500" />}
              title="Climb the leaderboard"
              description="Compare your streak and total achievements with other committed collectors of nonsense."
            />
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="border-y bg-muted/30 px-4 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-8 rounded-xl border bg-background p-6 shadow-sm sm:p-8 md:flex-row">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-500" />
              <p className="text-sm font-semibold text-primary">
                Keep the uselessness going
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-800">
              Your first five achievements are free.
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Subscribe when you&apos;re ready for unlimited achievements,
              continued streak progression, and full leaderboard participation.
              Choose monthly or annual billing and cancel anytime.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="w-full shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 md:w-auto"
          >
            <Link href="/pro">
              {initialEntitlements?.isSubscribed
                ? "View subscription"
                : "View subscription plans"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-background px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">
            Today&apos;s achievement isn&apos;t going to claim itself.
          </h2>

          <p className="mt-3 text-muted-foreground">
            Well, technically it could. But then what would be the point?
          </p>

          <Button
            size="lg"
            onClick={handleGetDailyAchievement}
            className="mt-6 bg-gradient-to-r from-primary to-blue-500 text-white hover:opacity-90"
          >
            Claim today&apos;s achievement
          </Button>
        </div>
      </section>

      {unlockedAchievement && (
        <UnlockAchievement
          achievement={unlockedAchievement}
          isOpen={showAchievementModal}
          onClose={() => setShowAchievementModal(false)}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-gray-50/80 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex size-10 items-center justify-center rounded-full bg-background shadow-sm">
        {icon}
      </div>

      <h3 className="mt-4 font-semibold text-gray-800">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
