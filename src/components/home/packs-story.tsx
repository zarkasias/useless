import Link from "next/link";

import { FeaturedPackPromo } from "@/components/packs/featured-pack-promo";
import type { StoreAchievementPack } from "@/lib/services/pack-store-service-server";

import styles from "./home.module.css";

interface PacksStoryProps {
  packs: StoreAchievementPack[];
  isLoggedIn: boolean;
}

export function PacksStory({ packs, isLoggedIn }: PacksStoryProps) {
  const featured = packs.find((pack) => pack.status === "active");
  const upcoming = packs.find((pack) => pack.status === "scheduled");

  if (!featured && !upcoming) return null;

  return (
    <section id="packs" className={`${styles.section} ${styles.packsSection}`}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>04 / Find your obsession</p>
        <h2>
          More ways to collect
          <br />
          the completely unnecessary.
        </h2>
        <p>
          Explore themed achievement packs and give your collection a whole new
          flavor of pointless.
        </p>
      </div>

      <div className={styles.packList}>
        {featured && (
          <FeaturedPackPromo
            pack={featured}
            variant="homepage"
            isLoggedIn={isLoggedIn}
          />
        )}

        {upcoming && (
          <FeaturedPackPromo
            pack={upcoming}
            variant="homepage"
            comingsoon
            isLoggedIn={isLoggedIn}
          />
        )}
      </div>

      <Link className={styles.textLink} href="/packs">
        Explore achievement packs ↗
      </Link>
    </section>
  );
}
