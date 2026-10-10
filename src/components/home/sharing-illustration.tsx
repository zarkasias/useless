import Link from "next/link";
import { Send, ArrowDown, Share2 } from "lucide-react";
import { HeroAchievementCard } from "./hero-achievement-card";
import type { ShowcaseAchievement } from "./home-data";
import styles from "./home-styles";

interface SharingIllustrationProps {
  achievement?: ShowcaseAchievement;
  isLoggedIn: boolean;
}

export function SharingIllustration({
  achievement,
  isLoggedIn,
}: SharingIllustrationProps) {
  return (
    <div className={styles.sharingIllustration}>
      <div className={styles.shareIntro}>
        <p className={styles.eyebrow}>Too pointless to keep to yourself</p>
        <h3>Earn it. Save it. Share it.</h3>
        <p>
          Share your achievement wherever you want — send it in a message, post
          it to Instagram, drop it into WhatsApp, or save it for later. Your
          pointless accomplishment, ready to show off anywhere.
        </p>
      </div>

      {achievement && (
        <div className={styles.shareExample}>
          <HeroAchievementCard achievement={achievement} />
        </div>
      )}

      <ArrowDown className={styles.shareArrow} aria-hidden="true" />

      <div className={styles.shareDestinations}>
        <div>
          <Share2 aria-hidden="true" />
          <strong>Share</strong>
          <span>Show off your achievements</span>
        </div>
        <div>
          <Send aria-hidden="true" />
          <strong>Send to a friend</strong>
          <span>Through WhatsApp</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Link
          className={styles.primaryButton}
          href={isLoggedIn ? "/collection" : "/signup?next=/collection"}
        >
          {isLoggedIn
            ? "Choose an achievement to share ↗"
            : "Sign up to share your achievements ↗"}
        </Link>

        {!isLoggedIn && (
          <Link className={styles.textLink} href="/login?next=/collection">
            Sign in to share ↗
          </Link>
        )}
      </div>
    </div>
  );
}
