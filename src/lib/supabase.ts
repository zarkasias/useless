import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AchievementType = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface Achievement {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  type: AchievementType;
  emoji: string;
  created_at: string;
  is_daily?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  streak_count: number;
  last_daily_achievement?: string;
}
