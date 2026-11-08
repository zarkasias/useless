import Image from "next/image";
import Link from "next/link";

import styles from "@/components/home/home-styles";

// Same games and art as components/home/games-story.tsx, in one compact row.
const games = [
  { title: "Memory", icon: "/game_icons/memory.webp", soon: false },
  { title: "Solitaire", icon: "/game_icons/solitaire.webp", soon: false },
  { title: "Spider Solitaire", icon: "/game_icons/spider.webp", soon: false },
  { title: "Guess", icon: "/game_icons/guess.webp", soon: true },
];

interface GamesStripProps {
  isLoggedIn: boolean;
  isSubscribed: boolean;
}

export function GamesStrip({ isLoggedIn, isSubscribed }: GamesStripProps) {
  const canPlay = isLoggedIn && isSubscribed;

  return (
    <section
      id="games"
      className="bg-[linear-gradient(180deg,#eff6ff,#f5f3ff)] px-5 py-16 text-center md:px-8 md:py-20"
      data-story-reveal
    >
      <h2 className="m-0 mb-3 text-[clamp(28px,4.5vw,44px)] font-black leading-[1.05] tracking-[-0.06em] text-gray-800">
        Your collection plays games, too.
      </h2>
      <p className="mx-auto mt-0 mb-9 max-w-[460px] text-base text-slate-600">
        Pointless card games powered by your achievements. Included with Pro.
      </p>

      <ul className="mx-auto mb-8 grid max-w-[720px] list-none grid-cols-4 gap-3 p-0 md:gap-8">
        {games.map((game) => (
          <li key={game.title} className="flex flex-col items-center gap-2">
            <span className="relative block">
              <Image
                src={game.icon}
                alt=""
                width={96}
                height={96}
                className="size-16 rounded-2xl shadow-[0_10px_24px_-10px_#1e1b4b55] md:size-24 md:rounded-3xl"
              />
              {game.soon && (
                <span className="absolute -top-2 -right-2 rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                  Soon
                </span>
              )}
            </span>
            <span className="text-[11px] font-bold leading-tight text-gray-700 md:text-sm">
              {game.title}
            </span>
          </li>
        ))}
      </ul>

      <Link
        className={styles.textLink}
        href={!isLoggedIn ? "/login?next=/games" : canPlay ? "/games" : "/pro"}
      >
        {!isLoggedIn
          ? "See the games ↗"
          : canPlay
            ? "Open the game cabinet ↗"
            : "Unlock games with Pro ↗"}
      </Link>
    </section>
  );
}
