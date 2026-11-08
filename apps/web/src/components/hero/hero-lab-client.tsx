"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { useDailyClaim } from "@/components/home-preview/use-daily-claim";
import type { ShareImageInput } from "@/lib/share-image";
import type { Achievement } from "@/lib/supabase";
import { CardStreamHero } from "./card-stream-hero";
import { createHeroConfig } from "./hero-config";
import { createHeroMotion } from "./hero-motion";

// The tuning panel only exists in development builds.
const HeroLeva =
  process.env.NODE_ENV === "production"
    ? () => null
    : dynamic(() => import("./hero-leva"), { ssr: false });

interface HeroLabClientProps {
  /** Sample achievements for the focus peek. */
  samples: ShareImageInput[];
  /** True when the visitor is signed in. */
  signedIn?: boolean;
  /** Not signed in, but this browser belongs to an account. */
  linked?: boolean;
  /** What the server says this visitor claimed today, from anywhere. */
  todaysClaim?: Achievement | null;
  /** This browser can only claim after signing in. */
  mustSignIn?: boolean;
}

/** The real hero, plus the leva panel for tuning it live. */
export function HeroLabClient({
  samples,
  signedIn = false,
  linked = false,
  todaysClaim = null,
  mustSignIn = false,
}: HeroLabClientProps) {
  const config = useRef(createHeroConfig()).current;
  const motion = useRef(createHeroMotion()).current;
  const [cardCount, setCardCount] = useState(config.stream.cardCount);
  const claimState = useDailyClaim({ signedIn, todaysClaim });

  // Lets browser tests and the console inspect the live motion values.
  useEffect(() => {
    (window as unknown as { heroLab?: object }).heroLab = { config, motion };
  }, [config, motion]);

  return (
    <>
      <HeroLeva config={config} onCardCountChange={setCardCount} />
      <CardStreamHero
        claimState={claimState}
        samples={samples}
        signedIn={signedIn}
        linked={linked}
        mustSignIn={mustSignIn}
        signInNext="/hero-lab"
        config={config}
        motion={motion}
        cardCount={cardCount}
      />
    </>
  );
}
