// card-pile.tsx
import type { GameCard } from "@/lib/types/gamecards";

import { createCardDragPreview } from "./card-drag-preview";

import { PlayingCard } from "./playing-card";

interface CardPileProps {
  label: string;
  card: GameCard | null;
  autoFinishCardId?: string | null;
  faceDown?: boolean;
  selected?: boolean;
  validTarget?: boolean;
  animateFlip?: boolean;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLButtonElement>) => void;

  onDrop?: (event: React.DragEvent<HTMLButtonElement>) => void;
}

export function CardPile({
  label,
  card,
  autoFinishCardId,
  faceDown = false,
  selected = false,
  validTarget = false,
  animateFlip = false,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CardPileProps) {
  return (
    <div className="space-y-1">
      <div className="text-center text-xs font-semibold capitalize text-emerald-100/70">
        {label}
      </div>

      <button
        type="button"
        draggable={Boolean(card && onDragStart)}
        onDragStart={(event) => {
          onDragStart?.(event);
          if (!event.defaultPrevented) {
            createCardDragPreview(event, [event.currentTarget]);
          }
        }}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
        disabled={!onClick}
        className={`
  block
  rounded-lg
  transition
  disabled:cursor-default
  ${
    selected
      ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900"
      : validTarget
        ? "ring-2 ring-emerald-300/80 ring-offset-2 ring-offset-emerald-950"
        : ""
  }
`}
      >
        {card ? (
          <PlayingCard
            card={
              faceDown
                ? {
                    ...card,
                    faceUp: false,
                  }
                : card
            }
            animateFlip={animateFlip}
            animateAutoFinish={card.id === autoFinishCardId}
          />
        ) : (
          <div className="h-[72px] w-[50px] sm:h-24 sm:w-16 rounded-lg border border-dashed border-white/30 bg-white/5" />
        )}
      </button>
    </div>
  );
}
