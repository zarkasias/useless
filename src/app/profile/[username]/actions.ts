"use server";

import { revalidatePath } from "next/cache";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "@/lib/services/friend-service-server";

export async function acceptFriendRequestAction(
  friendshipId: string,
  username: string,
) {
  try {
    await acceptFriendRequest(friendshipId);
    revalidatePath(`/profile/${username}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to accept friend request.",
    };
  }
}

export async function declineFriendRequestAction(
  friendshipId: string,
  username: string,
) {
  try {
    await declineFriendRequest(friendshipId);
    revalidatePath(`/profile/${username}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to decline friend request.",
    };
  }
}

export async function sendFriendRequestAction(
  targetUserId: string,
  username: string,
) {
  try {
    await sendFriendRequest(targetUserId);

    revalidatePath(`/profile/${username}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error sending friend request:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to send friend request.",
    };
  }
}
