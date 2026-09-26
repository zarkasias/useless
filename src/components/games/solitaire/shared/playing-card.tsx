// playing-card.tsx
import Image from "next/image";

import type { GameCard } from "@/lib/types/gamecards";

import { getSuitColor, getSuitSymbol } from "./card-display-utils";

interface PlayingCardProps {
  card: GameCard;
  animateFlip?: boolean;
}

export function PlayingCard({ card, animateFlip = false }: PlayingCardProps) {
  if (!card.faceUp) {
    return (
      <div className="relative h-[72px] w-[50px] sm:h-24 sm:w-16 overflow-hidden rounded-lg shadow-md transition-transform duration-200">
        <Image
          src="/game_icons/card-back.webp"
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>
    );
  }

  const suitColor = getSuitColor(card.suit);

  return (
    <div
      className={`
    flex h-[72px] w-[50px] sm:h-22 sm:w-16 flex-col justify-between rounded-lg
    border-2 border-gray-300 bg-white p-2 shadow-md
    ${animateFlip ? "animate-card-flip-in" : ""}
  `}
    >
      <div className={`text-left text-sm font-bold ${suitColor}`}>
        {card.rank}
      </div>

      <div className={`text-center text-lg ${suitColor}`}>
        {getSuitSymbol(card.suit)}
      </div>

      <div className={`rotate-180 text-left text-sm font-bold ${suitColor}`}>
        {card.rank}
      </div>
    </div>
  );
}
