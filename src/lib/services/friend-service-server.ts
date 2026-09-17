import "server-only";

import { getAuthenticatedUser } from "./utils/achievement-utils";
import { supabaseAdmin } from "./utils/trigger-context";
import { createNotification } from "./notification-service-server";

export type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  updated_at: string;
}

export interface FriendshipState {
  id: string | null;
  status: FriendshipStatus;
}

export interface FriendProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface FriendListItem {
  friendshipId: string;
  friend: FriendProfile;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------
// Private lookup helper
// --------------------------------------------------

async function findFriendshipBetweenUsers(
  userIdA: string,
  userIdB: string,
): Promise<Friendship | null> {
  const { data, error } = await supabaseAdmin
    .from("friendships")
    .select("*")
    .or(
      `and(requester_id.eq.${userIdA},addressee_id.eq.${userIdB}),and(requester_id.eq.${userIdB},addressee_id.eq.${userIdA})`,
    )
    .maybeSingle();

  if (error) {
    console.error("Error finding friendship:", error);
    throw new Error("Unable to load friendship.");
  }

  return data as Friendship | null;
}

// --------------------------------------------------
// Friendship status
// --------------------------------------------------

export async function getFriendshipStatus(
  viewerId: string,
  profileId: string,
): Promise<FriendshipState> {
  if (viewerId === profileId) {
    return {
      id: null,
      status: "none",
    };
  }

  const friendship = await findFriendshipBetweenUsers(viewerId, profileId);

  if (!friendship) {
    return {
      id: null,
      status: "none",
    };
  }

  if (friendship.status === "accepted") {
    return {
      id: friendship.id,
      status: "friends",
    };
  }

  if (friendship.status === "pending") {
    return {
      id: friendship.id,
      status:
        friendship.requester_id === viewerId
          ? "pending_sent"
          : "pending_received",
    };
  }

  return {
    id: null,
    status: "none",
  };
}

// --------------------------------------------------
// Send friend request
// --------------------------------------------------

export async function sendFriendRequest(
  targetUserId: string,
): Promise<Friendship> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  if (user.id === targetUserId) {
    throw new Error("You cannot add yourself as a friend.");
  }

  const existingFriendship = await findFriendshipBetweenUsers(
    user.id,
    targetUserId,
  );

  if (existingFriendship) {
    return existingFriendship;
  }

  const { data: friendship, error } = await supabaseAdmin
    .from("friendships")
    .insert({
      requester_id: user.id,
      addressee_id: targetUserId,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error sending friend request:", error);
    throw new Error("Unable to send friend request.");
  }

  try {
    await createNotification({
      userId: targetUserId,
      type: "friend_request",
      title: "New Friend Request",
      message: "You received a new friend request.",
      actorId: user.id,
      referenceId: friendship.id,
    });
  } catch (error) {
    console.error("Friend request created, but notification failed:", error);
  }

  return friendship as Friendship;
}

// --------------------------------------------------
// Accept friend request
// --------------------------------------------------

export async function acceptFriendRequest(
  friendshipId: string,
): Promise<Friendship> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: friendship, error: loadError } = await supabaseAdmin
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .single();

  if (loadError || !friendship) {
    console.error("Error loading friend request:", loadError);
    throw new Error("Friend request not found.");
  }

  if (friendship.addressee_id !== user.id) {
    throw new Error("You cannot accept this friend request.");
  }

  if (friendship.status !== "pending") {
    throw new Error("This friend request is no longer pending.");
  }

  const { data, error } = await supabaseAdmin
    .from("friendships")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", friendshipId)
    .select("*")
    .single();

  if (error) {
    console.error("Error accepting friend request:", error);
    throw new Error("Unable to accept friend request.");
  }

  return data as Friendship;
}

// --------------------------------------------------
// Decline friend request
// --------------------------------------------------

export async function declineFriendRequest(
  friendshipId: string,
): Promise<void> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: friendship, error: loadError } = await supabaseAdmin
    .from("friendships")
    .select("id, addressee_id, status")
    .eq("id", friendshipId)
    .single();

  if (loadError || !friendship) {
    throw new Error("Friend request not found.");
  }

  if (friendship.addressee_id !== user.id) {
    throw new Error("You cannot decline this friend request.");
  }

  if (friendship.status !== "pending") {
    throw new Error("This friend request is no longer pending.");
  }

  const { error } = await supabaseAdmin
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    console.error("Error declining friend request:", error);
    throw new Error("Unable to decline friend request.");
  }
}

// --------------------------------------------------
// Remove friend
// --------------------------------------------------

export async function removeFriend(friendshipId: string): Promise<void> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data: friendship, error: loadError } = await supabaseAdmin
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .eq("id", friendshipId)
    .single();

  if (loadError || !friendship) {
    throw new Error("Friendship not found.");
  }

  const belongsToUser =
    friendship.requester_id === user.id || friendship.addressee_id === user.id;

  if (!belongsToUser) {
    throw new Error("You cannot remove this friendship.");
  }

  if (friendship.status !== "accepted") {
    throw new Error("This relationship is not an active friendship.");
  }

  const { error } = await supabaseAdmin
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) {
    console.error("Error removing friend:", error);
    throw new Error("Unable to remove friend.");
  }
}

// --------------------------------------------------
// Get accepted friends
// --------------------------------------------------

export async function getFriends(userId: string): Promise<FriendListItem[]> {
  const { data, error } = await supabaseAdmin
    .from("friendships")
    .select(
      `
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      updated_at,
      requester:profiles!friendships_requester_id_fkey (
        id,
        username,
        avatar_url
      ),
      addressee:profiles!friendships_addressee_id_fkey (
        id,
        username,
        avatar_url
      )
    `,
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading friends:", error);
    throw new Error("Unable to load friends.");
  }

  return (data ?? []).map((friendship) => {
    const isRequester = friendship.requester_id === userId;

    const relatedProfile = isRequester
      ? friendship.addressee
      : friendship.requester;

    const friend = Array.isArray(relatedProfile)
      ? relatedProfile[0]
      : relatedProfile;

    if (!friend) {
      throw new Error("Friend profile not found.");
    }

    return {
      friendshipId: friendship.id,
      friend: {
        id: friend.id,
        username: friend.username,
        avatar_url: friend.avatar_url,
      },
      created_at: friendship.created_at,
      updated_at: friendship.updated_at,
    };
  });
}

// --------------------------------------------------
// Get incoming pending requests
// --------------------------------------------------

export async function getPendingFriendRequests(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("friendships")
    .select(
      `
      id,
      requester_id,
      addressee_id,
      status,
      created_at,
      requester:profiles!friendships_requester_id_fkey (
        id,
        username,
        avatar_url
      )
    `,
    )
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading friend requests:", error);
    throw new Error("Unable to load friend requests.");
  }

  return data ?? [];
}
