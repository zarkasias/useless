export type NotificationType =
  | "friend_request"
  | "friend_accepted"
  | "achievement"
  | "system";

export interface NotificationActor {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  actor_id: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: NotificationActor | null;
}
