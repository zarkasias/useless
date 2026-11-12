import Link from "next/link";

import styles from "@/components/home/home-styles";
import { glowClass } from "@/components/card-wall/wall-hero";

interface FinalCtaProps {
  hasClaimed: boolean;
  isClaiming: boolean;
  /** This browser can only claim after signing in. */
  mustSignIn?: boolean;
  onClaim: () => void;
}

export function FinalCta({
  hasClaimed,
  isClaiming,
  mustSignIn = false,
  onClaim,
}: FinalCtaProps) {
  return (
    <section
      className={`${glowClass} box-border w-full max-w-[900px] px-6 py-[110px] text-center max-[720px]:py-20 [&_a]:pointer-events-auto [&_button]:pointer-events-auto`}
      data-story-reveal
    >
      <h2 className="mx-auto mt-0 mb-7 max-w-[520px] text-[clamp(26px,4vw,40px)] font-black leading-[1.08] tracking-[-0.05em] text-gray-800">
        {hasClaimed
          ? "Your achievement is waiting to be shown off."
          : "Today's achievement isn't going to claim itself."}
      </h2>

      {hasClaimed ? (
        <a className={styles.primaryButton} href="#top">
          Back to my achievement <span aria-hidden="true">↑</span>
        </a>
      ) : mustSignIn ? (
        <Link className={styles.primaryButton} href="/login?next=%2F">
          Sign in to claim today&apos;s achievement
          <span aria-hidden="true">↗</span>
        </Link>
      ) : (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onClaim}
          disabled={isClaiming}
          aria-busy={isClaiming}
        >
          {isClaiming ? "Claiming…" : "Claim my useless achievement"}
          <span aria-hidden="true">↗</span>
        </button>
      )}
    </section>
  );
}
