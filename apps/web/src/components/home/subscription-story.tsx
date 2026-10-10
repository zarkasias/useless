"use client";

import { useState } from "react";
import Link from "next/link";

import styles from "./home-styles";

interface SubscriptionStoryProps {
  isSubscribed: boolean;
  isLoggedIn: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}

export function SubscriptionStory({
  isSubscribed,
  isLoggedIn,
  isClaiming,
  onClaim,
}: SubscriptionStoryProps) {
  const [annual, setAnnual] = useState(true);

  return (
    <section
      id="subscription"
      className={`${styles.section} ${styles.subscriptionSection}`}
    >
      <p className={styles.eyebrow}>Unlimited uselessness awaits</p>

      <h2 className={styles.subscriptionTitle}>
        Unlock
        <br />
        <span>unlimited uselessness.</span>
      </h2>

      <p className={styles.subscriptionDescription}>
        Collect unlimited ridiculous achievements, play achievement-powered
        games, protect your streak, and climb the leaderboard for absolutely no
        good reason.
      </p>

      <div className={styles.plan}>
        <p className={styles.planBadge}>Pro · Most useless</p>
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
          <span>/{annual ? "year" : "month"}</span>
        </div>

        {annual && (
          <p className={styles.finePrint}>
            About $2.08/month, billed annually.
          </p>
        )}

        <p className={styles.finePrint}>
          For people who refuse to stop accomplishing absolutely nothing.
        </p>

        <ul className={styles.planFeatures}>
          <li>Unlimited achievements</li>
          <li>Achievement-powered games</li>
          <li>Keep building your streak</li>
          <li>Full leaderboard participation</li>
          <li>Full achievement collection</li>
        </ul>

        <Link
          className={styles.primaryButton}
          href={
            isSubscribed
              ? "/pro"
              : !isLoggedIn
                ? `/signup?next=/pro&plan=${annual ? "year" : "month"}`
                : `/pro?plan=${annual ? "year" : "month"}`
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

      <p className={styles.subscriptionDescription}>
        No complicated tiers. No mysterious enterprise pricing. Just ten free
        achievements or unlimited pointless progress.
      </p>

      <div className={styles.finalClaim}>
        <p>Today&apos;s achievement isn&apos;t going to claim itself.</p>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onClaim}
          disabled={isClaiming}
          aria-busy={isClaiming}
        >
          {isClaiming ? "Claiming…" : "Claim my useless achievement ↗"}
        </button>
      </div>
    </section>
  );
}
