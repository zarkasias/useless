import type { GameResult } from "@/lib/types/games";

interface CalculateSpiderScoreParams {
  result: GameResult;
  moves: number;
}

export function calculateSpiderScore({
  result,
  moves,
}: CalculateSpiderScoreParams): number {
  if (!Number.isInteger(moves) || moves < 0) {
    throw new Error("Moves must be a non-negative integer");
  }

  if (result !== "win") {
    return 0;
  }

  const startingScore = 500;
  const completedRunBonus = 8 * 100;

  return Math.max(0, startingScore + completedRunBonus - moves);
}
