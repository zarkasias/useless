"use server";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";
import {
  getUserEntitlements,
  UserEntitlements,
} from "@/lib/services/entitlement-service-server";

export async function getCurrentUserEntitlementsAction(): Promise<UserEntitlements | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  return await getUserEntitlements(user.id);
}
