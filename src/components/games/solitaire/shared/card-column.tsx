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
  onCardDragStart?: (
    cardIndex: number,
    event: React.DragEvent<HTMLButtonElement>,
  ) => void;

  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;

  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
}

export function CardColumn({
  cards,
  selectedCardIndex = null,
  onCardClick,
  onColumnClick,
  onCardDragStart,
  onDragOver,
  onDrop,
  cardOffset = 28,
  mobileCardOffset = 20,
  minHeight = 340,
  validTarget = false,
  flippedCardId = null,
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
        <div className="h-[72px] w-[50px] sm:h-22 sm:w-16 rounded-lg border border-dashed border-white/30 bg-white/5" />
      )}

      {cards.map((card, cardIndex) => {
        const isSelected = selectedCardIndex === cardIndex;

        const createDragPreview = (
          event: React.DragEvent<HTMLButtonElement>,
          cardIndex: number,
        ) => {
          const column = event.currentTarget.parentElement;

          if (!column) {
            return;
          }

          const cardElements = Array.from(
            column.querySelectorAll<HTMLButtonElement>("button"),
          );

          const movingElements = cardElements.slice(cardIndex);

          const preview = document.createElement("div");

          preview.style.position = "fixed";
          preview.style.top = "-1000px";
          preview.style.left = "-1000px";
          preview.style.width = "64px";
          preview.style.height = `${
            96 + Math.max(0, movingElements.length - 1) * cardOffset
          }px`;
          preview.style.pointerEvents = "none";

          movingElements.forEach((element, index) => {
            const clone = element.cloneNode(true) as HTMLElement;

            clone.style.position = "absolute";
            clone.style.left = "0";
            clone.style.top = `${index * cardOffset}px`;
            clone.style.margin = "0";

            preview.appendChild(clone);
          });

          document.body.appendChild(preview);

          event.dataTransfer.setDragImage(preview, 32, 20);

          window.setTimeout(() => {
            preview.remove();
          }, 0);
        };

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

              createDragPreview(event, cardIndex);

              onCardDragStart?.(cardIndex, event);
            }}
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
