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
    .select(
      `
    id,
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    read_at,
    created_at,
    actor:profiles!notifications_actor_id_fkey (
      id,
      username,
      avatar_url
    )
  `,
    )
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw new Error("Unable to create notification.");
  }

  const actor = Array.isArray(data.actor)
    ? (data.actor[0] ?? null)
    : (data.actor ?? null);

  return {
    ...data,
    actor,
  } as UserNotification;
}

export async function getUnreadNotifications(
  userId: string,
): Promise<UserNotification[]> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select(
      `
      id,
      user_id,
      type,
      title,
      message,
      actor_id,
      reference_id,
      read_at,
      created_at,
      actor:profiles!notifications_actor_id_fkey (
        id,
        username,
        avatar_url
      )
      `,
    )
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Error loading unread notifications:", error);
    return [];
  }

  return (data ?? []).map((notification) => {
    const actor = Array.isArray(notification.actor)
      ? (notification.actor[0] ?? null)
      : (notification.actor ?? null);

    return {
      ...notification,
      actor,
    } as UserNotification;
  });
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
