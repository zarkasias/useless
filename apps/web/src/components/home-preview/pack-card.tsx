import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { packThemes } from "@/components/packs/pack-themes";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";
import { cn } from "@/lib/utils";

interface PackCardProps {
  pack: StoreAchievementPack;
  isLoggedIn: boolean;
  className?: string;
}

/**
 * A portrait version of FeaturedPackPromo, sized to sit beside the Pro card.
 * Prices, ownership and links follow components/packs/featured-pack-promo.tsx.
 */
export function PackCard({ pack, isLoggedIn, className }: PackCardProps) {
  const theme =
    packThemes[pack.theme_key as keyof typeof packThemes] ?? packThemes.default;

  const price =
    pack.price_cents !== null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: pack.currency?.toUpperCase() ?? "USD",
        }).format(pack.price_cents / 100)
      : null;

  const completion =
    pack.totalAchievements > 0
      ? Math.round((pack.collectedAchievements / pack.totalAchievements) * 100)
      : 0;

  const href = pack.owned
    ? `/packs/${pack.slug}`
    : isLoggedIn
      ? "/packs"
      : "/login?next=/packs";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-3xl border p-7 text-center text-white shadow-[0_18px_45px_#1e1b4b30] max-[700px]:p-6",
        theme.background,
        className,
      )}
    >
      <div
        className={`pointer-events-none absolute -top-14 -right-12 size-44 rounded-full ${theme.glowOne} blur-3xl`}
      />

      <div className="relative flex flex-wrap justify-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full border ${theme.badge} px-3 py-1 text-[11px] font-black tracking-wider uppercase`}
        >
          <Sparkles className="size-3" aria-hidden="true" />
          Featured pack
        </span>

        {pack.owned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold text-emerald-200">
            <Check className="size-3" aria-hidden="true" />
            Owned
          </span>
        )}
      </div>

      {pack.cover_image_path && (
        <Image
          src={pack.cover_image_path}
          alt={`${pack.name} artwork`}
          width={160}
          height={160}
          className="relative my-4 size-28 object-contain drop-shadow-xl md:my-6 md:size-40"
        />
      )}

      <h3 className="relative m-0 text-3xl font-black tracking-tight">
        {pack.name}
      </h3>

      {pack.description && (
        <p className="relative mt-2 mb-0 max-w-[300px] text-sm leading-6 text-white/80">
          {pack.description}
        </p>
      )}

      <p className="relative mt-4 mb-0 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
        <span className="text-white/80">
          {pack.totalAchievements} achievements
        </span>
        {pack.owned ? (
          <span className="font-semibold text-emerald-200">
            {pack.collectedAchievements} of {pack.totalAchievements} collected
          </span>
        ) : (
          price && (
            <span className="font-black text-amber-300">{price} one-time</span>
          )
        )}
      </p>

      {pack.owned && (
        <div className="relative mt-3 h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full bg-linear-to-r from-orange-400 to-amber-300"
            style={{ width: `${completion}%` }}
          />
        </div>
      )}

      {/* mt-auto keeps the buttons of both cards on the same line. */}
      <div className="relative mt-auto flex w-full flex-col items-center pt-7">
        <Link
          href={href}
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-extrabold text-purple-950 no-underline transition-transform duration-[180ms] hover:-translate-y-0.5"
        >
          {pack.owned ? "View pack progress" : "Explore pack"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>

        <Link
          href="/packs"
          className="my-4 text-xs font-bold text-white/80 underline underline-offset-4"
        >
          All achievement packs
        </Link>
      </div>
    </div>
  );
}
