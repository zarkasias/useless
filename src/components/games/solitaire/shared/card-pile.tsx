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
}

export function CardPile({
  label,
  card,
  faceDown = false,
  selected = false,
  validTarget = false,
  animateFlip = false,
  onClick,
}: CardPileProps) {
  return (
    <div className="space-y-1">
      <div className="text-center text-xs font-semibold capitalize text-emerald-100/70">
        {label}
      </div>

      <button
        type="button"
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
