import { CalculateKlondikeScoreParams } from "@/lib/types/games";

export function calculateKlondikeScore({
  result,
  moves,
  durationSeconds,
  autoFinished = false,
}: CalculateKlondikeScoreParams): number {
  if (result === "loss") {
    return 0;
  }

  const baseScore = 1000;

  // Don't punish reasonable play.
  const freeMoves = 80;
  const freeSeconds = 180;

  const extraMoves = Math.max(0, moves - freeMoves);
  const extraSeconds = Math.max(0, durationSeconds - freeSeconds);

  const movePenalty = extraMoves * 4;
  const timePenalty = Math.floor(extraSeconds * 0.5);

  // Auto-finish is just completing deterministic moves,
  // so it should not reduce the player's score.
  const autoFinishPenalty = autoFinished ? 0 : 0;

  const score = baseScore - movePenalty - timePenalty - autoFinishPenalty;

  return Math.max(100, Math.min(1000, Math.round(score)));
}
