import Link from "next/link";

import styles from "@/components/home/home-styles";

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
      className="bg-white px-5 py-16 text-center md:py-24"
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
