import "server-only";

import { supabaseAdmin } from "./utils/trigger-context";
import type {
  NotificationType,
  UserNotification,
} from "@/lib/types/notifications";

export async function createNotification({
  userId,
  type,
  title,
  message,
  actorId = null,
  referenceId = null,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actorId?: string | null;
  referenceId?: string | null;
}) {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      actor_id: actorId,
      reference_id: referenceId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw new Error("Unable to create notification.");
  }

  return data as UserNotification;
}

export async function getUnreadNotifications(
  userId: string,
): Promise<UserNotification[]> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Error loading unread notifications:", error);
    return [];
  }

  console.log("Unread notifications:", data);

  return (data ?? []) as UserNotification[];
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
) {
  const { error } = await supabaseAdmin
    .from("notifications")
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error marking notification as read:", error);
    throw new Error("Unable to update notification.");
  }
}
