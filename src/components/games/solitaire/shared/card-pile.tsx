// card-pile.tsx
import type { GameCard } from "@/lib/types/gamecards";

import { PlayingCard } from "./playing-card";

interface CardPileProps {
  label: string;
  card: GameCard | null;
  faceDown?: boolean;
  selected?: boolean;
  validTarget?: boolean;
  animateFlip?: boolean;
  onClick?: () => void;
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLButtonElement>) => void;

  onDrop?: (event: React.DragEvent<HTMLButtonElement>) => void;
}

export function CardPile({
  label,
  card,
  faceDown = false,
  selected = false,
  validTarget = false,
  animateFlip = false,
  onClick,
  onDragStart,
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
        onDragStart={onDragStart}
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
          />
        ) : (
          <div className="h-[72px] w-[50px] sm:h-22 sm:w-16 rounded-lg border border-dashed border-white/30 bg-white/5" />
        )}
      </button>
    </div>
  );
}
