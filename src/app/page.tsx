import HomeClient from "@/app/home/home-client";
import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";

export default async function HomePage() {
  const profile = await getAuthenticatedUserProfile();

  return <HomeClient initialProfile={profile} />;
}
