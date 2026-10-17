import type { GameCard } from "@/lib/types/gamecards";

export function flipTopCardIfNeeded(column: GameCard[]): GameCard[] {
  if (column.length === 0) {
    return column;
  }

  const nextColumn = [...column];
  const topCardIndex = nextColumn.length - 1;
  const topCard = nextColumn[topCardIndex];

  if (!topCard.faceUp) {
    nextColumn[topCardIndex] = {
      ...topCard,
      faceUp: true,
    };
  }

  return nextColumn;
}
