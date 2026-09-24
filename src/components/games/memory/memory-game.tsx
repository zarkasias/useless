"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";

import { RotateCcw } from "lucide-react";

import { GameTable } from "../system/game-table";
import GameMetric from "../game-metric";
import GameResult from "../system/game-result";
import GameButton from "../system/game-button";

import type { GameAchievement } from "@/lib/services/game-service-server";

import { shuffleAchievements } from "@/lib/services/utils/game-utils";

interface MemoryGameProps {
  achievements: GameAchievement[];
}

interface MemoryCard {
  cardId: string;
  achievementId: string;
  title: string;
  emoji: string;
  icon_path: string | null;
  type: string;
  isMatched: boolean;
}

export function MemoryGame({ achievements }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);

  const matchedCount = useMemo(
    () => cards.filter((card) => card.isMatched).length,
    [cards],
  );

  const isComplete = cards.length > 0 && matchedCount === cards.length;

  const createDeck = () => {
    const deck = achievements.flatMap((achievement) => [
      {
        cardId: `${achievement.id}-a`,
        achievementId: achievement.id,
        title: achievement.title,
        emoji: achievement.emoji,
        icon_path: achievement.icon_path,
        type: achievement.type,
        isMatched: false,
      },
      {
        cardId: `${achievement.id}-b`,
        achievementId: achievement.id,
        title: achievement.title,
        emoji: achievement.emoji,
        icon_path: achievement.icon_path,
        type: achievement.type,
        isMatched: false,
      },
    ]);

    return shuffleAchievements(deck);
  };

  const resetGame = () => {
    setCards(createDeck());
    setFlippedCards([]);
    setMoves(0);
    setMistakes(0);
    setStartedAt(null);
    setCompletedAt(null);
  };

  useEffect(() => {
    resetGame();
  }, [achievements]);

  useEffect(() => {
    if (isComplete && !completedAt) {
      setCompletedAt(Date.now());
    }
  }, [isComplete, completedAt]);

  const handleCardClick = (card: MemoryCard) => {
    if (card.isMatched) return;

    if (flippedCards.includes(card.cardId)) {
      return;
    }

    if (flippedCards.length >= 2) {
      return;
    }

    if (!startedAt) {
      setStartedAt(Date.now());
    }

    const nextFlipped = [...flippedCards, card.cardId];

    setFlippedCards(nextFlipped);

    if (nextFlipped.length !== 2) {
      return;
    }

    setMoves((current) => current + 1);

    const firstCard = cards.find((item) => item.cardId === nextFlipped[0]);

    const secondCard = cards.find((item) => item.cardId === nextFlipped[1]);

    if (!firstCard || !secondCard) {
      return;
    }

    if (firstCard.achievementId === secondCard.achievementId) {
      setCards((currentCards) =>
        currentCards.map((item) =>
          item.achievementId === firstCard.achievementId
            ? {
                ...item,
                isMatched: true,
              }
            : item,
        ),
      );

      setTimeout(() => {
        setFlippedCards([]);
      }, 450);

      return;
    }

    setMistakes((current) => current + 1);

    setTimeout(() => {
      setFlippedCards([]);
    }, 850);
  };

  const durationSeconds =
    startedAt && completedAt
      ? Math.max(1, Math.round((completedAt - startedAt) / 1000))
      : null;

  return (
    <GameTable className="space-y-5">
      {/* Game Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <GameMetric label="Moves" value={moves} />

          <GameMetric label="Mistakes" value={mistakes} />

          <GameMetric
            label="Pairs"
            value={`${matchedCount / 2}/${achievements.length}`}
          />
        </div>

        <GameButton onClick={resetGame} icon={<RotateCcw className="size-4" />}>
          Restart
        </GameButton>
      </div>

      <div className="relative roundex-xl p-4 sm:p-6">
        {/* Board */}
        <div
          className="
          mx-auto
          grid
          max-w-4xl
          grid-cols-3
          gap-3
          sm:grid-cols-4
          lg:grid-cols-6
        "
        >
          {cards.map((card) => {
            const isFlipped =
              card.isMatched || flippedCards.includes(card.cardId);

            return (
              <button
                key={card.cardId}
                type="button"
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched || isComplete}
                className="
                group
                relative
                w-[90%]
                aspect-[2/3]
                overflow-hidden
                rounded-xl
                focus-visible:outline-none
              "
                aria-label={isFlipped ? card.title : "Hidden achievement card"}
              >
                <div
                  className={`
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  transition-all
                  duration-300
                  ${
                    isFlipped
                      ? `
                        bg-gradient-to-br
                        from-white
                        via-violet-50
                        to-fuchsia-50
                        shadow-[0_4px_12px_rgba(0,0,0,0.22)]
                      `
                      : `
                       bg-transparent
                        shadow-[0_4px_12px_rgba(0,0,0,0.28)]
                        group-hover:-rotate-2
                        group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)]
                      `
                  }
                `}
                >
                  {isFlipped ? (
                    <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center sm:p-3">
                      {card.icon_path ? (
                        <div className="relative size-12 sm:size-16">
                          <Image
                            src={card.icon_path}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-contain drop-shadow-md"
                          />
                        </div>
                      ) : (
                        <span className="text-3xl sm:text-4xl">
                          {card.emoji}
                        </span>
                      )}

                      <span
                        className="
                        line-clamp-2
                        mt-1
                        text-[8px]
                        font-black
                        leading-tight
                        text-gray-700
                        sm:mt-2
                        sm:text-[11px]
                      "
                      >
                        {card.title}
                      </span>
                    </div>
                  ) : (
                    <div className="relative h-full w-full">
                      <Image
                        src="/game_icons/card-back.webp"
                        alt=""
                        width={400}
                        height={600}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Completed state */}
        {isComplete && (
          <div
            className="
        absolute
        inset-0
        z-20
        flex
        items-center
        justify-center
        rounded-xl
        bg-black/60
        p-5
        backdrop-blur-[2px]
        animate-in fade-in-0 duration-300
        sm:p-8
      "
          >
            <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
              <GameResult
                eyebrow="Completely unnecessary victory"
                title="You remembered all the things."
                description="Against all odds, your collection has finally proven useful."
                actionLabel="Play again"
                actionIcon={<RotateCcw className="size-4" />}
                onAction={resetGame}
                stats={
                  <>
                    <GameMetric label="Moves" value={moves} />

                    <GameMetric label="Mistakes" value={mistakes} />

                    <GameMetric
                      label="Time"
                      value={durationSeconds ? `${durationSeconds}s` : "—"}
                    />
                  </>
                }
              />
            </div>
          </div>
        )}
      </div>
    </GameTable>
  );
}
