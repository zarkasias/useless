"use client";

import { useState } from "react";
import Link from "next/link";

import styles from "@/components/home/home-styles";
import { PackCard } from "./pack-card";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";

interface GoFurtherProps {
  packs: StoreAchievementPack[];
  isLoggedIn: boolean;
  isSubscribed: boolean;
}

// Pricing and links match components/home/subscription-story.tsx.
export function GoFurther({ packs, isLoggedIn, isSubscribed }: GoFurtherProps) {
  const [annual, setAnnual] = useState(true);
  const featured = packs.find((pack) => pack.status === "active");
  const plan = annual ? "year" : "month";

  return (
    <section
      id="pro"
      className="bg-[linear-gradient(135deg,#ede9fe,#e0f2fe,#ffffff)] px-5 py-16 md:px-8 md:py-24"
      data-story-reveal
    >
      <h2 className="mx-auto mt-0 mb-10 max-w-[620px] text-center text-[clamp(30px,5vw,52px)] font-black leading-[1.02] tracking-[-0.06em] text-gray-800">
        Hooked? Get more useless.
      </h2>

      <div
        className={`mx-auto grid max-w-[410px] items-stretch gap-6 ${featured ? "lg:max-w-[850px] lg:grid-cols-2" : ""}`}
      >
        <div className={`${styles.plan} flex w-full flex-col text-center`}>
          <p className={`${styles.planBadge} self-center`}>
            Pro · Most useless
          </p>
          <div className={styles.segmented}>
            <button
              type="button"
              aria-pressed={!annual}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={annual}
              onClick={() => setAnnual(true)}
            >
              Annual · Save 30%
            </button>
          </div>

          <div className={styles.price} aria-live="polite">
            <strong>{annual ? "$24.99" : "$2.99"}</strong>
            <span>/{plan}</span>
          </div>

          <ul className={styles.planFeatures}>
            <li>Unlimited achievements</li>
            <li>Achievement-powered games</li>
            <li>Keep building your streak</li>
            <li>Full leaderboard participation</li>
          </ul>

          {/* mt-auto keeps the buttons of both cards on the same line. */}
          <div className="mt-auto flex flex-col">
            <Link
              className={styles.primaryButton}
              href={
                isSubscribed
                  ? "/pro"
                  : !isLoggedIn
                    ? `/signup?next=/pro&plan=${plan}`
                    : `/pro?plan=${plan}`
              }
            >
              {isSubscribed
                ? "View subscription ↗"
                : !isLoggedIn
                  ? "Create account to subscribe ↗"
                  : "Explore Pro ↗"}
            </Link>

            <p className={styles.finePrint}>
              Cancel anytime. Your dignity is already gone.
            </p>
          </div>
        </div>

        {featured && <PackCard pack={featured} isLoggedIn={isLoggedIn} />}
      </div>
    </section>
  );
}
