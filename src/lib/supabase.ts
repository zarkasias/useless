import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AchievementType =
  | "COMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY"
  | "SECRET";

export type AchievementStatus = "draft" | "review" | "published" | "archived";

export type AchievementTriggerType =
  | "daily_claim"
  | "streak"
  | "account_age"
  | "manual_award"
  | "collection_count";

export interface Achievement {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  type: AchievementType;
  emoji: string;
  icon_path?: string | null;
  created_at: string;
  is_daily?: boolean;
  is_secret: boolean;
  trigger_type: AchievementTriggerType | null;
  trigger_config: Record<string, unknown> | null;
  status: AchievementStatus;
}

export interface UserProfile {
  id: string;
  username: string;
  role: "user" | "admin";
  avatar_url?: string;
  created_at: string;
  streak_count: number;
  last_daily_achievement?: string;
  timezone?: string | null;
}
