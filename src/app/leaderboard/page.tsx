import { getAuthenticatedUserProfile } from "@/lib/achievement-service-server";
import { getLeaderboardUsers } from "@/lib/leaderboard-service-server";

import LeaderboardClient from "./leaderboard-client";

export default async function LeaderboardPage() {
  const [profile, leaderboardUsers] = await Promise.all([
    getAuthenticatedUserProfile(),
    getLeaderboardUsers(20),
  ]);

  return (
    <LeaderboardClient
      initialProfile={profile}
      initialUsers={leaderboardUsers}
    />
  );
}
