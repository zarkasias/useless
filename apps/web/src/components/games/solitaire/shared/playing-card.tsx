// playing-card.tsx
import Image from "next/image";

import type { GameCard } from "@/lib/types/gamecards";

import { getSuitColor, getSuitSymbol } from "./card-display-utils";

interface PlayingCardProps {
  card: GameCard;
  animateFlip?: boolean;
  animateAutoFinish?: boolean;
}

export function PlayingCard({
  card,
  animateFlip = false,
  animateAutoFinish = false,
}: PlayingCardProps) {
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
  const suitSymbol = getSuitSymbol(card.suit);
  const isFaceCard = ["J", "Q", "K"].includes(card.rank);
  const faceCardImage =
    card.rank === "J"
      ? "/game_icons/jack.webp"
      : card.rank === "Q"
        ? "/game_icons/queen.webp"
        : card.rank === "K"
          ? "/game_icons/king.webp"
          : null;
  const isAce = card.rank === "A";

  return (
    <div
      className={`
      relative
      flex
      h-[72px]
      w-[50px]
      sm:h-22
      sm:w-16
      flex-col
      overflow-hidden
      rounded-lg
      border
      border-gray-300
      bg-gradient-to-br
      from-white
      via-blue-100
      to-gray-100
      shadow-md

      ${animateFlip ? "animate-card-flip-in" : ""}
      ${animateAutoFinish ? "animate-card-auto-finish" : ""}
    `}
    >
      {/* subtle inner frame */}
      <div className="pointer-events-none absolute inset-[3px] rounded-[6px] border border-gray-200/70" />

      {/* top-left index */}
      <div
        className={`
        absolute
        left-1.5
        top-1
        flex
        flex-col
        items-center
        leading-none
        ${suitColor}
      `}
      >
        {isFaceCard ? (
          <span className="text-[10px] sm:text-sm">{suitSymbol}</span>
        ) : (
          <span className="text-[11px] font-black sm:text-sm">{card.rank}</span>
        )}
      </div>

      {/* center artwork */}
      <div className="flex h-full items-center justify-center">
        {isFaceCard && faceCardImage ? (
          <div className="relative h-[70%] w-[70%] sm:h-[76%] sm:w-[76%]">
            <Image
              src={faceCardImage}
              alt=""
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
        ) : isAce ? (
          <div className={`text-3xl sm:text-3xl ${suitColor}`}>
            {suitSymbol}
          </div>
        ) : (
          <div className={`text-xl sm:text-2xl ${suitColor}`}>{suitSymbol}</div>
        )}
      </div>

      {/* bottom-right index */}
      <div
        className={`
        absolute
        bottom-1
        right-1.5
        flex
        rotate-180
        flex-col
        items-center
        leading-none
        ${suitColor}
      `}
      >
        {isFaceCard ? (
          <span className="text-[10px] sm:text-sm">{suitSymbol}</span>
        ) : (
          <span className="text-[11px] font-black sm:text-sm">{card.rank}</span>
        )}
      </div>
    </div>
  );
}
