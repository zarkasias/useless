import { redirect } from "next/navigation";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getFriends } from "@/lib/services/friend-service-server";
import { FriendsClient } from "./friends-client";

export default async function FriendsPage() {
  const user = await getAuthenticatedUserProfile();

  if (!user) {
    redirect("/login");
  }

  const friends = await getFriends(user.id);
  return <FriendsClient user={user} friends={friends} />;
}
