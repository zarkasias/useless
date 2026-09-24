"use client";

import Image from "next/image";

import { Gamepad2, LockKeyhole, Sparkles } from "lucide-react";

import { Navbar } from "@/components/navbar";
import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { GameAchievement } from "@/lib/services/game-service-server";

interface GamesClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
  initialMemoryAchievements: GameAchievement[];
}

export default function GamesClient({
  initialProfile,
  initialEntitlements,
  initialMemoryAchievements,
}: GamesClientProps) {
  console.log(initialMemoryAchievements);

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar
        user={initialProfile}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <section>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
              <Gamepad2 className="size-4" />
              Useless Games
            </div>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-700 sm:text-4xl">
              Your achievements finally have a purpose.
            </h1>

            <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">
              Unfortunately, that purpose is wasting even more time.
            </p>
          </section>

          {/* Intro banner */}
          <section className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-lg shadow-indigo-500/20">
            <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-20 size-44 rounded-full bg-fuchsia-400/20 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-violet-100">
                  <Sparkles className="size-4" />
                  Collection powered
                </div>

                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Turn your useless collection into useless entertainment.
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-white/75">
                  Your collected achievements will become the cards, icons, and
                  pieces used across the Useless Games library.
                </p>
              </div>

              <div className="hidden lg:block">
                <Image
                  src="/icons/target.webp"
                  alt=""
                  width={110}
                  height={110}
                  className="size-24 rotate-6 object-contain opacity-90"
                />
              </div>
            </div>
          </section>

          {/* Games */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-gray-700 sm:text-2xl">
                Game cabinet
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Highly unnecessary activities, powered by your collection.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Memory */}
              <div
                className="
      group
      relative
      overflow-hidden
      rounded-2xl
      border
      border-violet-200
      bg-gradient-to-br
      from-violet-50
      via-white
      to-fuchsia-50
      shadow-sm
      transition-all
      duration-300
      hover:-translate-y-1
      hover:shadow-lg
      hover:shadow-violet-500/10
    "
              >
                <div className="absolute -right-10 -top-10 size-36 rounded-full bg-violet-300/20 blur-3xl" />

                <div className="relative flex gap-5 p-5">
                  <div
                    className="
          flex
          size-24
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-gradient-to-br
          from-violet-100/50
          via-fuchsia-100/50
          to-pink-100/50
          shadow-inner
          transition-transform
          duration-300
          group-hover:rotate-3
          group-hover:scale-105
        "
                  >
                    <Image
                      src="/game_icons/memory.webp"
                      alt="Achievement Memory"
                      width={98}
                      height={98}
                      className="size-24 object-contain drop-shadow-md"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700">
                      <Sparkles className="size-3" />
                      Ready to play
                    </div>

                    <h3 className="text-xl font-black tracking-tight text-gray-700">
                      Achievement Memory
                    </h3>

                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      Flip cards and match pairs using icons pulled straight
                      from your achievement collection.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between border-t border-violet-100 bg-white/60 px-5 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Powered by your collection
                  </span>

                  {!initialEntitlements.isSubscribed && (
                    <div className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">
                      <LockKeyhole className="size-3.5" />
                      Pro
                    </div>
                  )}
                </div>
              </div>

              {/* Solitaire */}
              <div
                className="
      group
      relative
      overflow-hidden
      rounded-2xl
      border
      border-orange-200
      bg-gradient-to-br
      from-orange-50
      via-white
      to-amber-50
      shadow-sm
      transition-all
      duration-300
      hover:-translate-y-1
      hover:shadow-lg
      hover:shadow-orange-500/10
    "
              >
                <div className="absolute -right-10 -top-10 size-36 rounded-full bg-orange-300/20 blur-3xl" />

                <div className="relative flex gap-5 p-5">
                  <div
                    className="
          flex
          size-24
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-gradient-to-br
          from-orange-100/50
          via-amber-100/50
          to-yellow-100/50
          shadow-inner
          transition-transform
          duration-300
          group-hover:-rotate-3
          group-hover:scale-105
        "
                  >
                    <Image
                      src="/game_icons/solitaire.webp"
                      alt="Useless Solitaire"
                      width={98}
                      height={98}
                      className="size-24 object-contain drop-shadow-md"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700">
                      Coming soon
                    </div>

                    <h3 className="text-xl font-black tracking-tight text-gray-700">
                      Useless Solitaire
                    </h3>

                    <p className="mt-2 text-sm leading-5 text-muted-foreground">
                      Classic solitaire with a thoroughly unnecessary Useless
                      Achievements makeover.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between border-t border-orange-100 bg-white/60 px-5 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    More pointless fun incoming
                  </span>

                  <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    <LockKeyhole className="size-3.5" />
                    Soon
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
