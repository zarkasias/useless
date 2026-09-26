// components/games/solitaire/shared/card-column.tsx

import type { GameCard } from "@/lib/types/gamecards";

import { PlayingCard } from "./playing-card";

interface CardColumnProps {
  cards: GameCard[];
  selectedCardIndex?: number | null;
  onCardClick?: (cardIndex: number) => void;
  onColumnClick?: () => void;
  cardOffset?: number;
  mobileCardOffset?: number;
  minHeight?: number;
  validTarget?: boolean;
  flippedCardId?: string | null;
}

export function CardColumn({
  cards,
  selectedCardIndex = null,
  onCardClick,
  onColumnClick,
  cardOffset = 28,
  mobileCardOffset = 20,
  minHeight = 340,
  validTarget = false,
  flippedCardId = null,
}: CardColumnProps) {
  return (
    <div className="relative" style={{ minHeight }} onClick={onColumnClick}>
      {validTarget && (
        <div
          className="pointer-events-none absolute left-0 h-[72px] w-[50px] sm:h-22 sm:w-16 rounded-lg ring-2 ring-emerald-300/80 ring-offset-2 ring-offset-emerald-950"
          style={{
            top: cards.length === 0 ? 0 : (cards.length - 1) * cardOffset,
          }}
        />
      )}
      {cards.length === 0 && (
        <div className="h-[72px] w-[50px] sm:h-22 sm:w-16 rounded-lg border border-dashed border-white/30 bg-white/5" />
      )}

      {cards.map((card, cardIndex) => {
        const isSelected = selectedCardIndex === cardIndex;

        return (
          <button
            key={card.id}
            type="button"
            disabled={!card.faceUp}
            onClick={(event) => {
              event.stopPropagation();
              onCardClick?.(cardIndex);
            }}
            className={`
              absolute
              left-0
              rounded-lg
              transition
              disabled:cursor-default
              ${
                isSelected
                  ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900"
                  : ""
              }
            `}
            style={{
              top: `${cardIndex * cardOffset}px`,
            }}
          >
            <PlayingCard card={card} animateFlip={card.id === flippedCardId} />
          </button>
        );
      })}
    </div>
  );
}
