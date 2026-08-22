"use server";

import { getAuthenticatedUser } from "@/lib/achievement-service-server";
import {
  getUserEntitlements,
  UserEntitlements,
} from "@/lib/entitlement-service-server";

export async function getCurrentUserEntitlementsAction(): Promise<UserEntitlements | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  return await getUserEntitlements(user.id);
}
