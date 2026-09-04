import Image from "next/image";
import Link from "next/link";

import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";

import { packThemes } from "@/components/packs/pack-themes";

interface FeaturedPackPromoProps {
  pack: StoreAchievementPack;
  variant?: "homepage" | "dashboard";
  isLoggedIn?: boolean;
}

export function FeaturedPackPromo({
  pack,
  variant = "dashboard",
  isLoggedIn = false,
}: FeaturedPackPromoProps) {
  const completionPercentage =
    pack.totalAchievements > 0
      ? Math.round((pack.collectedAchievements / pack.totalAchievements) * 100)
      : 0;

  const price =
    pack.price_cents !== null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: pack.currency?.toUpperCase() ?? "USD",
        }).format(pack.price_cents / 100)
      : null;

  const theme =
    packThemes[pack.theme_key as keyof typeof packThemes] ?? packThemes.default;

  const packHref = pack.owned
    ? `/packs/${pack.slug}`
    : isLoggedIn
      ? "/packs"
      : "/login?next=/packs";

  if (variant === "dashboard") {
    return (
      <div
        className={`relative overflow-hidden rounded-lg border ${theme.background} px-4 py-3 text-white shadow-sm`}
      >
        <div
          className={`absolute -right-10 -top-14 size-36 rounded-full ${theme.glowOne} blur-3xl`}
        />

        <div className="relative flex items-center gap-4">
          {pack.cover_image_path && (
            <Image
              src={pack.cover_image_path}
              alt={`${pack.name} artwork`}
              width={72}
              height={72}
              className="size-16 shrink-0 object-contain drop-shadow-lg sm:size-20"
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border ${theme.badge} px-2 py-0.5 text-[10px] font-black uppercase tracking-wider`}
              >
                <Sparkles className="size-3" />
                Featured Pack
              </span>

              {pack.owned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                  <Check className="size-3" />
                  Owned
                </span>
              )}
            </div>

            <h2 className="mt-1 truncate text-lg font-black sm:text-xl">
              {pack.name}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-purple-100/75">
              <span>{pack.totalAchievements} achievements</span>

              {!pack.owned && price && (
                <span className="font-bold text-amber-300">
                  {price} one-time
                </span>
              )}

              {pack.owned && (
                <span>
                  {pack.collectedAchievements} of {pack.totalAchievements}{" "}
                  collected
                </span>
              )}
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="shrink-0 rounded-xl bg-white font-bold text-purple-950 hover:bg-purple-50"
          >
            <Link href={pack.owned ? `/packs/${pack.slug}` : "/packs"}>
              {pack.owned ? "View" : "Explore"}
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${theme.background} px-5 py-4 text-white shadow-md sm:px-6 sm:py-5`}
    >
      <div
        className={`absolute -right-12 -top-14 size-40 rounded-full ${theme.glowOne} blur-3xl`}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        {pack.cover_image_path && (
          <div className="flex shrink-0 justify-center">
            <Image
              src={pack.cover_image_path}
              alt={`${pack.name} artwork`}
              width={120}
              height={120}
              className="size-24 object-contain drop-shadow-xl sm:size-28"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border ${theme.badge} px-2.5 py-1 text-[10px] font-black uppercase tracking-wider`}
            >
              <Sparkles className="size-3" />
              Featured Pack
            </span>

            {pack.owned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                <Check className="size-3" />
                Owned
              </span>
            )}
          </div>

          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
            {pack.name}
          </h2>

          {pack.description && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-purple-100/80">
              {pack.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-purple-100/80">
              {pack.totalAchievements} achievements
            </span>

            {!pack.owned && price && (
              <span className="font-black text-amber-300">
                {price} one-time
              </span>
            )}

            {pack.owned && (
              <span className="font-semibold text-emerald-200">
                {pack.collectedAchievements} of {pack.totalAchievements}{" "}
                collected
              </span>
            )}
          </div>

          {pack.owned && (
            <div className="mt-3 max-w-md">
              <div className="h-2 overflow-hidden rounded-full bg-black/25">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-300"
                  style={{
                    width: `${completionPercentage}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 sm:pl-4">
          <Button
            asChild
            size="sm"
            className="w-full rounded-xl bg-white font-bold text-purple-950 hover:bg-purple-50 sm:w-auto"
          >
            <Link href={packHref}>
              {pack.owned ? "View Pack Progress" : "Explore Pack"}

              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
