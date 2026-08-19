import { redirect } from "next/navigation";
import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/achievement-service-server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const profile = await getAuthenticatedUserProfile();

  if (!profile) {
    redirect("/");
  }

  return <DashboardClient initialProfile={profile} />;
}
