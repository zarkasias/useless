import { CalculateMemoryScoreInput } from "@/lib/types/games";

export function calculateMemoryScore({
  pairs,
  moves,
  mistakes,
  durationSeconds,
}: CalculateMemoryScoreInput): number {
  const baseScore = 1000;

  const minimumMoves = pairs;

  const extraMoves = Math.max(moves - minimumMoves, 0);

  const movePenalty = extraMoves * 35;
  const mistakePenalty = mistakes * 40;
  const timePenalty = Math.max(durationSeconds - 20, 0) * 2;

  const score = baseScore - movePenalty - mistakePenalty - timePenalty;

  return Math.max(0, Math.min(1000, score));
}
