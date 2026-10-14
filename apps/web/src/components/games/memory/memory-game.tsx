"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";

import Image from "next/image";

import { RotateCcw } from "lucide-react";

import { GameTable } from "../system/game-table";
import GameMetric from "../game-metric";
import GameResult from "../system/game-result";
import GameResultOverlay from "../system/game-result-overlay";
import GameButton from "../system/game-button";
import { getAchievementIconUrl } from "@/lib/achievement-icon-url";
import { AchievementCard } from "@/components/achievement-card-updated";

import type { GameAchievement } from "@/lib/types/games";
import type { Achievement } from "@/lib/supabase";

import { shuffleAchievements } from "@/lib/services/utils/game-utils";
import { calculateMemoryScore } from "@/lib/games/memory/memory-scoring";
import { recordMemoryGameResultAction } from "@/app/actions/game-actions";

interface MemoryGameProps {
  achievements: GameAchievement[];
  onGameRecorded?: () => void;
}

interface MemoryCard {
  cardId: string;
  achievementId: string;
  title: string;
  emoji: string;
  iconUrl: string | null;
  type: string;
  isMatched: boolean;
}

export function MemoryGame({ achievements, onGameRecorded }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [imagesReady, setImagesReady] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<
    Achievement[]
  >([]);
  const hasRecordedResult = useRef(false);

  const matchedCount = useMemo(
    () => cards.filter((card) => card.isMatched).length,
    [cards],
  );

  const isComplete = cards.length > 0 && matchedCount === cards.length;

  const createDeck = useCallback(() => {
    const deck = achievements.flatMap((achievement) => {
      const iconUrl = getAchievementIconUrl(achievement.icon_path);
      return [
        {
          cardId: `${achievement.id}-a`,
          achievementId: achievement.id,
          title: achievement.title,
          emoji: achievement.emoji,
          iconUrl,
          type: achievement.type,
          isMatched: false,
        },
        {
          cardId: `${achievement.id}-b`,
          achievementId: achievement.id,
          title: achievement.title,
          emoji: achievement.emoji,
          iconUrl,
          type: achievement.type,
          isMatched: false,
        },
      ];
    });

    return shuffleAchievements(deck);
  }, [achievements]);

  const resetGame = useCallback(() => {
    hasRecordedResult.current = false;

    setCards(createDeck());
    setFlippedCards([]);
    setMoves(0);
    setMistakes(0);
    setStartedAt(null);
    setCompletedAt(null);
    setFinalScore(null);
    setUnlockedAchievements([]);
  }, [createDeck]);

  useEffect(() => {
    let cancelled = false;

    async function preloadAchievementImages() {
      setImagesReady(false);

      const imageUrls = achievements
        .map((achievement) => getAchievementIconUrl(achievement.icon_path))
        .filter((path): path is string => Boolean(path));

      await Promise.all(
        imageUrls.map(async (src) => {
          const img = new window.Image();

          img.src = src;

          try {
            await img.decode();
          } catch {
            // Don't block the game if one image fails to decode.
          }
        }),
      );

      if (!cancelled) {
        setImagesReady(true);
      }
    }

    void preloadAchievementImages();

    return () => {
      cancelled = true;
    };
  }, [achievements]);

  useEffect(() => {
    if (cards.length === 0) {
      resetGame();
    }
  }, [cards.length, resetGame]);

  useEffect(() => {
    if (!isComplete || completedAt || !startedAt || hasRecordedResult.current) {
      return;
    }

    const completedTime = Date.now();

    setCompletedAt(completedTime);

    hasRecordedResult.current = true;

    const durationSeconds = Math.max(
      1,
      Math.round((completedTime - startedAt) / 1000),
    );

    const score = calculateMemoryScore({
      pairs: achievements.length,
      moves,
      mistakes,
      durationSeconds,
    });

    setFinalScore(score);

    void (async () => {
      const result = await recordMemoryGameResultAction({
        result: "win",
        moves,
        mistakes,
        durationSeconds,
        pairs: achievements.length,
        achievementIds: achievements.map((achievement) => achievement.id),
        score,
      });

      if (result.success) {
        setUnlockedAchievements(result.unlockedAchievements ?? []);
        onGameRecorded?.();
      }
    })();
  }, [
    isComplete,
    completedAt,
    startedAt,
    moves,
    mistakes,
    achievements,
    onGameRecorded,
  ]);

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

      <div className="relative rounded-xl p-4 sm:p-6">
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
                disabled={!imagesReady || card.isMatched || isComplete}
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
                        bg-linear-to-br
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
                      {card.iconUrl ? (
                        <div className="relative size-12 sm:size-16">
                          <Image
                            src={card.iconUrl}
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
                        priority
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

        {!imagesReady && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/45 backdrop-blur-[2px]">
            <div className="rounded-xl border border-amber-300/30 bg-black/70 px-5 py-3 text-sm font-bold text-amber-100 shadow-lg">
              Loading achievements...
            </div>
          </div>
        )}

        {/* Completed state */}
        {isComplete && (
          <GameResultOverlay>
            <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
              <GameResult
                eyebrow="Completely unnecessary victory"
                title="You've got a great Useless Memory!!"
                description="Your collection has finally proven useful."
                actionLabel="Play again"
                actionIcon={<RotateCcw className="size-4" />}
                onAction={resetGame}
                stats={
                  <>
                    <GameMetric label="Score" value={finalScore ?? "—"} />
                    <GameMetric label="Moves" value={moves} />

                    <GameMetric label="Mistakes" value={mistakes} />

                    <GameMetric
                      label="Time"
                      value={durationSeconds ? `${durationSeconds}s` : "—"}
                    />
                  </>
                }
              />
              {unlockedAchievements.length > 0 && (
                <div className="mt-5 space-y-3">
                  <div className="text-center text-xs font-black uppercase tracking-[0.2em] text-amber-200/70">
                    Achievement Unlocked
                  </div>

                  <div className="flex justify-center">
                    <div className="w-full max-w-xs">
                      {unlockedAchievements.map((achievement) => (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          ingrid={true}
                          isCollected={true}
                          showShareButton={false}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GameResultOverlay>
        )}
      </div>
    </GameTable>
  );
}
