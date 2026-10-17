"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";

import {
  getUnreadNotifications,
  markNotificationAsRead,
} from "@/lib/services/notification-service-server";

import {
  acceptFriendRequest,
  declineFriendRequest,
} from "@/lib/services/friend-service-server";

export async function getUnreadNotificationsAction() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        success: true,
        notifications: [],
      };
    }

    const notifications = await getUnreadNotifications(user.id);

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    console.error("Error loading notifications:", error);

    return {
      success: false,
      notifications: [],
      message: "Unable to load notifications.",
    };
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      throw new Error("Authentication required.");
    }

    await markNotificationAsRead(notificationId, user.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update notification.",
    };
  }
}

export async function acceptFriendRequestNotificationAction(
  friendshipId: string,
  notificationId: string,
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      throw new Error("Authentication required.");
    }

    await acceptFriendRequest(friendshipId);

    await markNotificationAsRead(notificationId, user.id);

    revalidatePath("/leaderboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error accepting friend request:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to accept friend request.",
    };
  }
}

export async function declineFriendRequestNotificationAction(
  friendshipId: string,
  notificationId: string,
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      throw new Error("Authentication required.");
    }

    await declineFriendRequest(friendshipId);

    await markNotificationAsRead(notificationId, user.id);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error declining friend request:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to decline friend request.",
    };
  }
}
