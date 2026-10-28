"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Gamepad2, Sparkles } from "lucide-react";
import GameCabinetCard from "@/components/games/game-card";
import { gameCardThemes } from "@/components/games/game-card-themes";

import { Navbar } from "@/components/navbar";
import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

interface GamesClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
}

export default function GamesClient({
  initialProfile,
  initialEntitlements,
}: GamesClientProps) {
  const router = useRouter();

  const toMemory = () => {
    if (initialEntitlements.isSubscribed) {
      router.push("/games/memory");
    }
  };

  const toSolitaire = () => {
    if (initialEntitlements.isSubscribed) {
      router.push("/games/solitaire");
    }
  };

  const toSpider = () => {
    if (initialEntitlements.isSubscribed) {
      router.push("/games/spider");
    }
  };

  const toGuess = () => {
    if (initialEntitlements.isSubscribed) {
      router.push("/games/guess");
    }
  };

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
                onClick={toMemory}
                className={`
                  ${initialEntitlements.isSubscribed ? "cursor-pointer" : ""}`}
              >
                <GameCabinetCard
                  title="Achievement Memory"
                  description="Put your memory to the test. Forget why you started."
                  icon="/game_icons/memory.webp"
                  available
                  footerText="Remember to accomplish nothing"
                  theme={gameCardThemes.memory}
                  subscribed={initialEntitlements.isSubscribed}
                />
              </div>

              {/* Solitaire */}
              <div
                onClick={toSolitaire}
                className={`
                  ${initialEntitlements.isSubscribed ? "cursor-pointer" : ""}
    `}
              >
                <GameCabinetCard
                  title="Useless Solitaire"
                  description="All the satisfaction of winning Solitaire. None of the productivity."
                  icon="/game_icons/solitaire.webp"
                  available
                  footerText="Because one pointless game wasn't enough"
                  theme={gameCardThemes.solitaire}
                  subscribed={initialEntitlements.isSubscribed}
                />
              </div>

              <div
                onClick={toSpider}
                className={`
                  ${initialEntitlements.isSubscribed ? "cursor-pointer" : ""}
    `}
              >
                <GameCabinetCard
                  title="Useless Spider Solitaire"
                  description="Eight legs. Ten columns. Absolutely no reason to be productive."
                  icon="/game_icons/spider.webp"
                  available={true}
                  footerText="Get tangled in pointless fun"
                  theme={gameCardThemes.spider}
                  subscribed={initialEntitlements.isSubscribed}
                />
              </div>

              <div
                role="link"
                tabIndex={initialEntitlements.isSubscribed ? 0 : undefined}
                aria-label="Play Useless Guess"
                aria-disabled={!initialEntitlements.isSubscribed}
                onClick={toGuess}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toGuess();
                  }
                }}
                className={initialEntitlements.isSubscribed ? "cursor-pointer rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring" : ""}
              >
                <GameCabinetCard
                  title="Useless Guess"
                  description="Five letters. Six guesses. With zero usefulness."
                  icon="/game_icons/guess.webp"
                  available
                  footerText="Find the word. Accomplish nothing."
                  theme={gameCardThemes.words}
                  subscribed={initialEntitlements.isSubscribed}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
