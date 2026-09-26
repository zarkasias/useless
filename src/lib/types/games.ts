import type { Achievement } from "@/lib/supabase";

export type GameTriggerType = "game_stat" | "game_session";

export type GameTriggerMetric =
  | "games_played"
  | "games_completed"
  | "wins"
  | "losses"
  | "abandoned"
  | "score"
  | "best_score"
  | "moves"
  | "mistakes"
  | "duration_seconds"
  | "current_win_streak"
  | "best_win_streak"
  | "total_score"
  | "total_duration_seconds";

export type GameTriggerOperator = "=" | ">=" | "<=" | ">" | "<";

export interface GameTriggerConfig {
  game: GameType | "all";
  metric: GameTriggerMetric;
  operator: GameTriggerOperator;
  value: number;
}

export interface RecordedGameResult {
  session: GameSession;
  stats: UserGameStats;
  unlockedAchievements: Achievement[];
}

export type GameType = "memory" | "solitaire";

export type SolitaireVariant = "klondike" | "spider";

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
