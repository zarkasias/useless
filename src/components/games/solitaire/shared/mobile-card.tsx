import Image from "next/image";
import type { GameCard } from "@/lib/types/gamecards";
import { getSuitSymbol } from "../shared/card-display-utils";

export default function MobileCard({
  card,
  active,
}: {
  card: GameCard;
  active?: boolean;
}) {
  if (!card.faceUp) {
    return (
      <span className="block aspect-[5/7] w-full rounded-lg shadow-md">
        <Image
          src="/game_icons/card-back.webp"
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`relative block aspect-[5/7] w-full rounded-md border border-slate-300 bg-white shadow-sm ${card.suit === "hearts" || card.suit === "diamonds" ? "text-red-700" : "text-slate-900"} ${active ? "animate-card-auto-finish" : ""}`}
    >
      <span className="absolute left-0.5 top-1 flex items-center gap-px text-[clamp(10px,2.8vw,15px)] font-black leading-none">
        {card.rank}
        <span>{getSuitSymbol(card.suit)}</span>
      </span>
      <span className="absolute inset-x-0 bottom-1 text-center text-xl leading-none">
        {getSuitSymbol(card.suit)}
      </span>
    </span>
  );
}
