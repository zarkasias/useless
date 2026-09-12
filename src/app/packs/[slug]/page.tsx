import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { CheckCircle2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { packThemes } from "@/components/packs/pack-themes";
import { Card, CardContent } from "@/components/ui/card";

import { AchievementCard } from "@/components/achievement-card-updated";

import {
  getAuthenticatedUser,
  getAuthenticatedUserAchievements,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import {
  getPublishedAchievementsForPack,
  getStoreAchievementPacks,
} from "@/lib/services/pack-store-service-server";

import { Navbar } from "@/components/navbar";

export default async function PackDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { slug } = await params;
  const { purchase } = await searchParams;

  const user = await getAuthenticatedUser();

  const [profile, packs, entitlements, userAchievements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getStoreAchievementPacks(),
    user ? getUserEntitlements(user.id) : Promise.resolve(null),
    user ? getAuthenticatedUserAchievements() : Promise.resolve([]),
  ]);

  const pack = packs.find((item) => item.slug === slug);

  if (!pack) {
    notFound();
  }

  const packAchievements = await getPublishedAchievementsForPack(pack.id);

  const collectedAchievements = new Map(
    userAchievements.map((achievement) => [achievement.id, achievement]),
  );

  const theme =
    packThemes[pack.theme_key as keyof typeof packThemes] ?? packThemes.default;

  const completionPercentage =
    pack.totalAchievements > 0
      ? Math.round((pack.collectedAchievements / pack.totalAchievements) * 100)
      : 0;
  return (
    <div className="min-h-screen">
      {profile && entitlements && (
        <Navbar
          user={profile}
          isSubscribed={entitlements.isSubscribed}
          subscriptionStatus={entitlements.subscriptionStatus}
        />
      )}

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/packs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to packs
        </Link>

        {purchase === "success" && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

            <div>
              <p className="font-bold">Payment received</p>

              <p className="mt-1 text-sm">
                Your pack purchase is being confirmed.
              </p>
            </div>
          </div>
        )}

        <Card
          className={`overflow-hidden rounded-lg border-0 ${theme.background} shadow-xl`}
        >
          <div
            className={`absolute -right-20 -top-20 size-64 rounded-full ${theme.glowOne} blur-3xl`}
          />
          <div
            className={`absolute -bottom-20 -left-16 size-56 rounded-full ${theme.glowTwo} blur-3xl`}
          />
          <CardContent className="p-0">
            <div className="grid md:grid-cols-[300px_1fr]">
              <div className="flex items-center justify-center p-6">
                {pack.cover_image_path ? (
                  <Image
                    src={pack.cover_image_path}
                    alt={`${pack.name} artwork`}
                    width={280}
                    height={280}
                    className="h-auto w-full max-w-[220px] object-contain drop-shadow-xl"
                  />
                ) : (
                  <div className="flex size-56 items-center justify-center rounded-3xl border border-dashed text-sm text-muted-foreground">
                    Pack artwork
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-sm font-bold uppercase tracking-wider text-white/80">
                  Achievement Pack
                </p>

                <h1 className="mt-2 text-4xl font-black text-white tracking-tight">
                  {pack.name}
                </h1>

                <p className="mt-2 text-gray-100/80">{pack.description}</p>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-white">
                    {pack.collectedAchievements} of {pack.totalAchievements}{" "}
                    collected
                  </p>

                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400"
                      style={{
                        width: `${completionPercentage}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  {pack.owned ? (
                    <div className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                      You own this pack.
                    </div>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href="/packs">Return to Packs</Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Pack collection
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-700">
                Achievements
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {pack.collectedAchievements} of {pack.totalAchievements}{" "}
                collected
              </p>
            </div>

            {pack.owned && pack.totalAchievements > 0 && (
              <span className="text-sm font-semibold text-muted-foreground">
                {completionPercentage}% complete
              </span>
            )}
          </div>

          {packAchievements.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packAchievements.map((achievement) => {
                const collectedAchievement = collectedAchievements.get(
                  achievement.id,
                );

                const isCollected = !!collectedAchievement;

                return (
                  <div key={achievement.id} className="relative">
                    <div
                      className={
                        isCollected
                          ? "transition-all"
                          : "grayscale opacity-45 transition-all"
                      }
                    >
                      <AchievementCard
                        achievement={achievement}
                        unlockedAt={collectedAchievement?.created_at}
                        ingrid
                        showShareButton={false}
                        variant="compact"
                      />
                    </div>

                    {/* {isCollected && (
                      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        <CheckCircle2 className="size-3" />
                        Collected
                      </div>
                    )} */}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No achievements have been published for this pack yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
