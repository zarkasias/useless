export type GameType = "memory" | "solitaire";

export type GameResult = "win" | "loss" | "abandoned";

export interface CalculateMemoryScoreInput {
  pairs: number;
  moves: number;
  mistakes: number;
  durationSeconds: number;
}

export interface RecordGameSessionInput {
  gameType: GameType;
  result: GameResult;

  score?: number | null;
  moves?: number | null;
  mistakes?: number | null;
  durationSeconds?: number | null;

  metadata?: Record<string, unknown>;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: GameType;
  result: GameResult;

  score: number | null;
  moves: number | null;
  mistakes: number | null;
  duration_seconds: number | null;

  metadata: Record<string, unknown>;

  started_at: string;
  completed_at: string | null;
}

export interface GameAchievement {
  id: string;
  title: string;
  emoji: string;
  icon_path: string | null;
  type: string;
}

export interface UserGameStats {
  user_id: string;
  game_type: GameType;

  games_played: number;
  games_completed: number;

  wins: number;
  losses: number;
  abandoned: number;

  total_score: number;
  best_score: number | null;

  total_duration_seconds: number;

  current_win_streak: number;
  best_win_streak: number;

  last_played_at: string | null;
  updated_at: string;
}
