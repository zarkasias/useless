import Image from "next/image";
import Link from "next/link";

import { Check, LockKeyhole, Sparkles } from "lucide-react";

import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import { createPackCheckoutAction } from "@/app/packs/actions";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { packThemes } from "./pack-themes";

interface AchievementPackCardProps {
  pack: StoreAchievementPack;
}

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents === null) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() ?? "USD",
  }).format(priceCents / 100);
}

export function AchievementPackCard({ pack }: AchievementPackCardProps) {
  const price = formatPrice(pack.price_cents, pack.currency);

  const completionPercentage =
    pack.totalAchievements > 0
      ? Math.round((pack.collectedAchievements / pack.totalAchievements) * 100)
      : 0;

  const theme =
    packThemes[pack.theme_key as keyof typeof packThemes] ?? packThemes.default;

  return (
    <Card
      className={`group relative overflow-hidden rounded-xl border-0 ${theme.background} p-0 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div
        className={`absolute -right-20 -top-20 size-64 rounded-full ${theme.glowOne} blur-3xl`}
      />
      <div
        className={`absolute -bottom-20 -left-16 size-56 rounded-full ${theme.glowTwo} blur-3xl`}
      />

      <CardContent className="relative p-0">
        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="relative flex flex-col min-h-[180px] items-start justify-start overflow-hidden bg-black/10 px-6 py-6">
            {pack.cover_image_path ? (
              <Image
                src={pack.cover_image_path}
                alt={`${pack.name} pack artwork`}
                width={220}
                height={220}
                className="h-auto w-full max-w-[190px] object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-40 items-center justify-center rounded-3xl border border-white/15 bg-white/10 text-sm text-white/50">
                Pack artwork
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm justify-center">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white font-bold">
                {pack.totalAchievements} achievements
              </span>

              {pack.owned && (
                <span className="w-[80%] inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-5 py-1 text-xs font-bold text-emerald-200">
                  <Check className="size-3.5" />
                  Owned
                </span>
              )}

              {!pack.owned && price && (
                <span
                  className={`rounded-full border ${theme.price} px-3 py-1.5 font-bold`}
                >
                  {price} one-time
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border ${theme.badge} px-3 py-1 text-xs font-bold uppercase tracking-wider`}
              >
                <Sparkles className="size-3.5" />
                Limited Pack
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl -rotate-2">
              {pack.name}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-purple-100/80">
              {pack.description ??
                "A seasonal collection of gloriously unnecessary achievements."}
            </p>

            {pack.owned && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Pack progress</span>

                  <span className="text-purple-100/75">
                    {pack.collectedAchievements} of {pack.totalAchievements}
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/30">
                  <div
                    className={`h-full rounded-full ${theme.progress} transition-all`}
                    style={{
                      width: `${completionPercentage}%`,
                    }}
                  />
                </div>

                {pack.completed && (
                  <div className="mt-2 flex items-center gap-2 text-sm font-bold text-amber-200">
                    <Image
                      src={"/icons/golden_trophy.webp"}
                      alt={"Achievement Pack Completed"}
                      width={40}
                      height={40}
                      className="w-8 h-8"
                    />
                    Pack complete!
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              {pack.owned ? (
                <Button
                  asChild
                  className="w-full rounded-xl bg-white font-bold text-purple-950 hover:bg-purple-50"
                >
                  <Link href={`/packs/${pack.slug}`}>
                    {pack.completed
                      ? "View Completed Pack"
                      : "View Pack Progress"}
                  </Link>
                </Button>
              ) : pack.availableForPurchase ? (
                <form action={createPackCheckoutAction}>
                  <input type="hidden" name="packId" value={pack.id} />
                  <Button
                    className={`w-full rounded-xl ${theme.button} font-bold shadow-lg`}
                  >
                    <LockKeyhole className="mr-2 size-4" />
                    Unlock for {price}
                  </Button>
                </form>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full rounded-xl"
                  disabled
                >
                  Currently Unavailable
                </Button>
              )}
            </div>

            {pack.availableForPurchase && !pack.owned && (
              <p className="mt-3 text-center text-xs text-purple-100/60">
                One-time purchase. Earn the achievements through your daily
                rotation.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
