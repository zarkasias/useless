"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GameCabinetCard from "@/components/games/game-card";
import { gameCardThemes } from "@/components/games/game-card-themes";
import styles from "./home-styles";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const games = [
  {
    title: "Achievement Memory",
    description: "Put your memory to the test. Forget why you started.",
    icon: "/game_icons/memory.webp",
    footerText: "Remember to accomplish nothing",
    theme: gameCardThemes.memory,
    href: "/games/memory",
    available: true,
  },
  {
    title: "Useless Solitaire",
    description:
      "All the satisfaction of winning Solitaire. None of the productivity.",
    icon: "/game_icons/solitaire.webp",
    footerText: "Because one pointless game wasn't enough",
    theme: gameCardThemes.solitaire,
    href: "/games/solitaire",
    available: true,
  },
  {
    title: "Useless Spider Solitaire",
    description:
      "Eight legs. Ten columns. Absolutely no reason to be productive.",
    icon: "/game_icons/spider.webp",
    footerText: "Get tangled in pointless fun",
    theme: gameCardThemes.spider,
    href: "/games/spider",
    available: true,
  },
  {
    title: "Useless Guess",
    description: "Five letters. Six guesses. With zero usefulness.",
    icon: "/game_icons/guess.webp",
    footerText: "We're still finding the words",
    theme: gameCardThemes.words,
    href: null,
    available: false,
  },
];

interface GamesStoryProps {
  isLoggedIn: boolean;
  isSubscribed: boolean;
}

export function GamesStory({ isLoggedIn, isSubscribed }: GamesStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canPlay = isLoggedIn && isSubscribed;

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-cabinet-enter]", {
          y: 60,
          autoAlpha: 0,
          scale: 0.94,
          duration: 0.8,
          stagger: 0.13,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            once: true,
          },
        });
      });
      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="games"
      className={`${styles.section} ${styles.gamesSection}`}
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>02 / Play</p>
        <h2>
          Your achievements finally
          <br />
          have a purpose.
        </h2>
        <p>
          Unfortunately, that purpose is wasting even more time. Your collection
          powers a cabinet full of highly unnecessary games, included with Pro.
        </p>
      </div>

      <div className={styles.cabinetStage}>
        {games.map((game, index) => {
          const card = (
            <GameCabinetCard
              title={game.title}
              description={game.description}
              icon={game.icon}
              available={game.available}
              footerText={game.footerText}
              theme={game.theme}
              subscribed={canPlay}
            />
          );
          return (
            <div
              key={game.title}
              className={styles.cabinetItem}
              style={
                {
                  "--cabinet-angle": `${[-3, 2, -1, 3][index]}deg`,
                } as CSSProperties
              }
            >
              <div data-cabinet-enter>
                {canPlay && game.href ? (
                  <Link
                    className={styles.cabinetLink}
                    href={game.href}
                    aria-label={`Play ${game.title}`}
                  >
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.gameCta}>
        <Link
          className={styles.primaryButton}
          href={
            !isLoggedIn ? "/login?next=/games" : canPlay ? "/games" : "/pro"
          }
        >
          {!isLoggedIn
            ? "Sign in to explore games ↗"
            : canPlay
              ? "Open the game cabinet ↗"
              : "Unlock games with Pro ↗"}
        </Link>
        <p className={styles.finePrint}>
          Playing requires an account and an active Pro subscription.
        </p>
      </div>
    </section>
  );
}
