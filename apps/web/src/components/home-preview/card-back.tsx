import Image from "next/image";

import { achievementCardTokens } from "@/components/achievement-styles";
import { fredoka } from "@/components/utils/title-fonts";

/** The site logo shown on the back of every card. */
export const CARD_BACK_LOGO_SRC = "/icons/golden_trophy_lrg.webp";

/**
 * The back of an achievement card. It uses the in-app card frame (gradient
 * border, radius and surface) so it turns over into an AchievementCard.
 */
export function CardBack() {
  return (
    <div
      className="size-full bg-[linear-gradient(135deg,#7c3aed,#3b82f6)] p-[2px] shadow-[0_18px_40px_-14px_#4c1d9580]"
      style={{ borderRadius: achievementCardTokens.outerRadius }}
    >
      <div
        className="relative flex size-full flex-col items-center justify-center gap-3 overflow-hidden bg-[radial-gradient(circle_at_50%_42%,#ffffffcc_0%,#ede9fe_45%,#dbeafe_100%)]"
        style={{ borderRadius: achievementCardTokens.radius }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-2.5 rounded-[12px] border border-violet-300/60"
        />
        <Image
          src={CARD_BACK_LOGO_SRC}
          alt=""
          width={250}
          height={250}
          className="relative w-[58%] drop-shadow-[0_8px_14px_#7c3aed40]"
          draggable={false}
        />
        <span
          className={`${fredoka.className} relative text-center text-sm font-semibold leading-tight text-violet-900`}
        >
          Useless Achievements
        </span>
      </div>
    </div>
  );
}
