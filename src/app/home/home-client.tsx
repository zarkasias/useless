"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { FeaturedPackPromo } from "@/components/packs/featured-pack-promo";
import { FeatureCard } from "@/components/feature-card";

import { Achievement, UserProfile } from "@/lib/supabase";
import { claimDailyAchievementAction } from "@/app/actions/achievement-actions";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import { toast } from "sonner";

interface HomeClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
  initialPacks: StoreAchievementPack[];
}

export default function HomeClient({
  initialProfile,
  initialEntitlements,
  initialPacks,
}: HomeClientProps) {
  const router = useRouter();
  const user = initialProfile;

  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const handleGetDailyAchievement = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const result = await claimDailyAchievementAction(timezone);

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
    } finally {
      setIsClaiming(false);
    }
  };

  const featuredPack = initialPacks?.[0] ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar
        user={user}
        isSubscribed={initialEntitlements?.isSubscribed ?? false}
        subscriptionStatus={initialEntitlements?.subscriptionStatus ?? null}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-b from-violet-50 via-blue-50 to-background px-4 pt-12 sm:pt-16 lg:pt-16">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[6%] top-24 size-3 rotate-12 rounded-sm bg-yellow-300 sm:size-4" />
          <div className="absolute right-[8%] top-32 size-4 rotate-45 rounded-sm bg-violet-300 sm:size-5" />
          <div className="absolute left-[15%] top-[52%] size-2.5 rounded-full bg-blue-300 sm:size-3" />
          <div className="absolute right-[16%] top-[58%] size-2.5 rounded-full bg-pink-300 sm:size-3" />

          <div className="absolute left-1/2 top-10 size-64 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl sm:size-96" />
          <div className="absolute bottom-10 left-[10%] size-44 rounded-full bg-blue-400/10 blur-3xl sm:size-72" />
          <div className="absolute bottom-0 right-[8%] size-44 rounded-full bg-pink-400/10 blur-3xl sm:size-72" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <div className="mx-auto inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-violet-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
            <Sparkles className="size-3.5 sm:size-4" />
            Ten useless achievements are on us
          </div>

          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-tight text-gray-800 sm:mt-6 sm:text-5xl md:text-6xl lg:text-7xl">
            Accomplish absolutely{" "}
            <span className="inline-block -rotate-2 bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent pb-2">
              nothing useful.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
            Earn ridiculous digital awards, build a completely unnecessary
            streak, and prove once and for all that pointless progress is still
            progress.
          </p>

          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={handleGetDailyAchievement}
              disabled={isClaiming}
              aria-busy={isClaiming}
              className="h-12 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-6 text-base font-bold text-white shadow-lg shadow-violet-500/20 transition-transform hover:scale-105 sm:px-7"
            >
              <Trophy className="mr-2 size-5" />
              {isClaiming ? "Claiming…" : "Claim my useless achievement"}
            </Button>

            {!user ? (
              <Link
                href="/signup"
                className="text-sm text-gray-700 font-medium underline underline-offset-4"
              >
                Create an account
              </Link>
            ) : (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full bg-white/90 px-6 font-semibold backdrop-blur sm:px-7"
              >
                <Link href="/collection">See my ridiculous collection</Link>
              </Button>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {user
              ? "Your first 10 achievements are free, claimed one day at a time."
              : "Try without an account. Create one to keep your collection."}
          </p>
        </div>

        {/* Main hero artwork */}
        <div className="relative z-10 mx-auto -mb-6 mt-2 w-full max-w-5xl sm:-mb-10 sm:mt-0 lg:-mb-14">
          <Image
            src="/achievement_burst.webp"
            alt="A burst of colorful useless achievement awards"
            width={1600}
            height={1200}
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1000px"
            className="h-auto w-full object-contain"
          />
        </div>
      </section>

      {/* Product value */}
      <section className="bg-background px-4 py-12">
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
              variant="daily"
              title="Claim daily"
              description="One new day. One gloriously unnecessary achievement."
            />

            <FeatureCard
              variant="streak"
              title="Build a streak"
              rotate="right"
              description="Come back tomorrow and keep your pointless progress going."
            />

            <FeatureCard
              variant="collection"
              title="Grow your collection"
              description="Collect Common through Legendary awards, then share your pointless glory."
            />

            <FeatureCard
              variant="leaderboard"
              title="Climb the leaderboard"
              rotate="right"
              description="See how your streak and collection stack up against fellow collectors."
            />
          </div>
        </div>
      </section>

      {featuredPack && (
        <section className="bg-background px-4 py-4">
          <div className="mx-auto w-full max-w-6xl">
            <div className="mb-4 text-center">
              <p className="text-sm font-semibold text-violet-600 -rotate-2">
                Something extra pointless
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-800">
                Limited achievement packs have arrived.
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-muted-foreground">
                Add themed collections to your daily rotation and collect even
                more things with absolutely no practical value.
              </p>
            </div>

            <FeaturedPackPromo
              pack={featuredPack}
              variant="homepage"
              isLoggedIn={!!user}
            />
          </div>
        </section>
      )}

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
              Your first ten achievements are free.
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Keep claiming daily, building your streak, and climbing the
              leaderboard with Pro.{" "}
              <span className="font-semibold text-foreground">
                $2.99/month or $24.99/year.
              </span>{" "}
              Cancel anytime.
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
      <section className="bg-background px-4 py-10 text-center">
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
            disabled={isClaiming}
            aria-busy={isClaiming}
            className="mt-4 bg-gradient-to-r from-primary to-blue-500 text-white hover:opacity-90"
          >
            {isClaiming ? "Claiming…" : "Claim my useless achievement"}
          </Button>
          {!user && (
            <p className="mt-3 text-xs text-muted-foreground">
              Try without an account. Create one to keep your collection.
            </p>
          )}
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
