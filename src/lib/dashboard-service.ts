import { createClient } from "@/lib/supabase/server";
import { Achievement, UserProfile } from "@/lib/supabase";

export interface DashboardData {
  user: UserProfile;
  achievements: Achievement[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient();

  // Get the authenticated user from the server
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching dashboard profile:", profileError);
    return null;
  }

  // Get the user's achievements
  const { data: achievements, error: achievementsError } = await supabase
    .from("user_achievements")
    .select(
      `
      *,
      achievements (*)
    `,
    )
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false });

  if (achievementsError) {
    console.error("Error fetching dashboard achievements:", achievementsError);

    return null;
  }

  return {
    user: profile as UserProfile,
    achievements: achievements as Achievement[],
  };
}
