// components/games/solitaire/shared/card-column.tsx

import type { GameCard } from "@/lib/types/gamecards";

import { createCardDragPreview } from "./card-drag-preview";

import { PlayingCard } from "./playing-card";

interface CardColumnProps {
  cards: GameCard[];
  selectedCardIndex?: number | null;
  autoFinishCardId?: string | null;
  onCardClick?: (cardIndex: number) => void;
  onColumnClick?: () => void;
  cardOffset?: number;
  mobileCardOffset?: number;
  minHeight?: number;
  validTarget?: boolean;
  flippedCardId?: string | null;
  hintCardIndex?: number | null;
  hintTarget?: boolean;
  onCardDragStart?: (
    cardIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => void;

  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;

  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function CardColumn({
  cards,
  selectedCardIndex = null,
  onCardClick,
  onColumnClick,
  onCardDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  cardOffset = 28,
  autoFinishCardId,
  minHeight = 340,
  validTarget = false,
  hintTarget = false,
  flippedCardId = null,
  hintCardIndex = null,
}: CardColumnProps) {
  return (
    <div
      className="relative"
      style={{ minHeight }}
      onClick={onColumnClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {validTarget && (
        <div
          className="pointer-events-none absolute left-0 h-[72px] w-[50px] sm:h-22 sm:w-16 rounded-lg ring-2 ring-emerald-300/80 ring-offset-2 ring-offset-emerald-950"
          style={{
            top: cards.length === 0 ? 0 : (cards.length - 1) * cardOffset,
          }}
        />
      )}
      {cards.length === 0 && (
        <div
          className={`
      h-[72px]
      w-[50px]
      rounded-lg
      border
      border-dashed
      border-white/30
      bg-white/5
      sm:h-22
      sm:w-16
      ${
        hintTarget
          ? "ring-2 ring-emerald-300 ring-offset-1 ring-offset-emerald-900"
          : ""
      }
    `}
        />
      )}

      {cards.map((card, cardIndex) => {
        const isSelected = selectedCardIndex === cardIndex;

        const isTopCard = cardIndex === cards.length - 1;

        const isHinted =
          hintCardIndex !== null &&
          hintCardIndex !== undefined &&
          cardIndex >= hintCardIndex;

        return (
          <button
            key={card.id}
            type="button"
            draggable={card.faceUp}
            disabled={!card.faceUp}
            onDragStart={(event) => {
              if (!card.faceUp) {
                event.preventDefault();
                return;
              }

              event.dataTransfer.effectAllowed = "move";

              const column = event.currentTarget.parentElement!;
              const cards = Array.from(
                column.querySelectorAll<HTMLButtonElement>("button"),
              );
              createCardDragPreview(event, cards.slice(cardIndex));

              onCardDragStart?.(cardIndex, event);
            }}
            onDragEnd={onDragEnd}
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
              ${isHinted ? "rounded-lg ring-2 ring-amber-300" : ""}
              ${
                hintTarget && isTopCard
                  ? "rounded-lg ring-2 ring-emerald-300 ring-offset-1 ring-offset-emerald-900"
                  : ""
              }
            `}
            style={{
              top: `${cardIndex * cardOffset}px`,
            }}
          >
            <PlayingCard
              card={card}
              animateFlip={card.id === flippedCardId}
              animateAutoFinish={card.id === autoFinishCardId}
            />
          </button>
        );
      })}
    </div>
  );
}
