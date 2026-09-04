import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { CheckCircle2, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { packThemes } from "@/components/packs/pack-themes";
import { Card, CardContent } from "@/components/ui/card";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";

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

  const [profile, packs, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getStoreAchievementPacks(),
    user ? getUserEntitlements(user.id) : Promise.resolve(null),
  ]);

  const pack = packs.find((item) => item.slug === slug);

  if (!pack) {
    notFound();
  }

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
              <div className="flex items-center justify-center p-8">
                {pack.cover_image_path ? (
                  <Image
                    src={pack.cover_image_path}
                    alt={`${pack.name} artwork`}
                    width={280}
                    height={280}
                    className="h-auto w-full max-w-[260px] object-contain drop-shadow-xl"
                  />
                ) : (
                  <div className="flex size-56 items-center justify-center rounded-3xl border border-dashed text-sm text-muted-foreground">
                    Pack artwork
                  </div>
                )}
              </div>

              <div className="p-8">
                <p className="text-sm font-bold uppercase tracking-wider text-white/80">
                  Achievement Pack
                </p>

                <h1 className="mt-2 text-4xl font-black text-white tracking-tight">
                  {pack.name}
                </h1>

                <p className="mt-4 text-gray-100/80">{pack.description}</p>

                <div className="mt-6">
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

                <div className="mt-8">
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
      </main>
    </div>
  );
}
