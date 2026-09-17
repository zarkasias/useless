"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { Bell, Info, Check, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { UserNotification } from "@/lib/types/notifications";

import {
  acceptFriendRequestNotificationAction,
  declineFriendRequestNotificationAction,
  getUnreadNotificationsAction,
  markNotificationAsReadAction,
} from "@/app/actions/notification-actions";

interface NotificationCenterProps {
  enabled: boolean;
}

export function NotificationCenter({ enabled }: NotificationCenterProps) {
  const pathname = usePathname();

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [previewNotification, setPreviewNotification] =
    useState<UserNotification | null>(null);

  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.length;

  // --------------------------------------------------
  // Load unread notifications
  // --------------------------------------------------

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      return;
    }

    startTransition(async () => {
      const result = await getUnreadNotificationsAction();

      if (!result.success) {
        console.error(result.message);
        return;
      }

      setNotifications(result.notifications);
    });
  }, [enabled, pathname]);

  // --------------------------------------------------
  // Temporary notification preview
  // --------------------------------------------------

  useEffect(() => {
    if (!notifications.length) {
      return;
    }

    const notification = notifications[0];

    const storageKey = `notification-preview-${notification.id}`;

    const alreadyPreviewed = sessionStorage.getItem(storageKey);

    if (alreadyPreviewed) {
      return;
    }

    sessionStorage.setItem(storageKey, "true");

    setPreviewNotification(notification);

    const timeout = window.setTimeout(() => {
      setPreviewNotification(null);
    }, 5000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [notifications]);

  // --------------------------------------------------
  // Remove notification locally
  // --------------------------------------------------

  const removeNotification = (notificationId: string) => {
    setNotifications((current) =>
      current.filter((notification) => notification.id !== notificationId),
    );

    setPreviewNotification((current) =>
      current?.id === notificationId ? null : current,
    );
  };

  // --------------------------------------------------
  // Mark ordinary notification read
  // --------------------------------------------------

  const handleDismiss = (notification: UserNotification) => {
    startTransition(async () => {
      const result = await markNotificationAsReadAction(notification.id);

      if (!result.success) {
        console.error(result.message);
        return;
      }

      removeNotification(notification.id);
    });
  };

  // --------------------------------------------------
  // Accept friend request
  // --------------------------------------------------

  const handleAcceptFriend = (notification: UserNotification) => {
    if (!notification.reference_id) {
      return;
    }

    startTransition(async () => {
      const result = await acceptFriendRequestNotificationAction(
        notification.reference_id!,
        notification.id,
      );

      if (!result.success) {
        console.error(result.message);
        return;
      }

      removeNotification(notification.id);
    });
  };

  // --------------------------------------------------
  // Decline friend request
  // --------------------------------------------------

  const handleDeclineFriend = (notification: UserNotification) => {
    if (!notification.reference_id) {
      return;
    }

    startTransition(async () => {
      const result = await declineFriendRequestNotificationAction(
        notification.reference_id!,
        notification.id,
      );

      if (!result.success) {
        console.error(result.message);
        return;
      }

      removeNotification(notification.id);
    });
  };

  if (!enabled) {
    return null;
  }

  return (
    <>
      {/* Bell */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative size-10 rounded-lg"
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
          >
            <Bell className="size-5" />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0 sm:w-96">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Notifications</h2>

              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto size-7 text-muted-foreground" />

              <p className="mt-2 text-sm font-medium">No notifications</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Absolutely nothing is happening.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isPending={isPending}
                  onAccept={() => handleAcceptFriend(notification)}
                  onDecline={() => handleDeclineFriend(notification)}
                  onDismiss={() => handleDismiss(notification)}
                />
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Temporary preview */}
      {previewNotification && (
        <div className="fixed right-4 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-2 fade-in">
          <div className="rounded-lg border bg-background p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                {previewNotification.type === "friend_request" ? (
                  <UserPlus className="size-4 text-primary" />
                ) : previewNotification.type === "system" ? (
                  <Info className="size-4 text-primary" />
                ) : (
                  <Bell className="size-4 text-primary" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold">{previewNotification.title}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {previewNotification.actor?.username
                    ? `${previewNotification.actor.username} sent you a friend request.`
                    : previewNotification.message}
                </p>

                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                  onClick={() => {
                    setPreviewNotification(null);
                    setPopoverOpen(true);
                  }}
                >
                  View notification
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Close notification preview"
                onClick={() => setPreviewNotification(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface NotificationItemProps {
  notification: UserNotification;
  isPending: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

function NotificationItem({
  notification,
  isPending,
  onAccept,
  onDecline,
  onDismiss,
}: NotificationItemProps) {
  const isFriendRequest = notification.type === "friend_request";

  return (
    <div className="border-b p-4 last:border-b-0">
      <div className="flex gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {isFriendRequest ? (
            <UserPlus className="size-4 text-primary" />
          ) : (
            <Bell className="size-4 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{notification.title}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            {isFriendRequest && notification.actor?.username
              ? `${notification.actor.username} sent you a friend request.`
              : notification.message}
          </p>

          {isFriendRequest && notification.actor?.username && (
            <Link
              href={`/profile/${notification.actor.username}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              View profile
            </Link>
          )}

          {isFriendRequest ? (
            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={onAccept}
              >
                <Check className="mr-1 size-4" />
                Accept
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={onDecline}
              >
                <X className="mr-1 size-4" />
                Decline
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isPending}
                onClick={onDismiss}
              >
                Mark as read
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
