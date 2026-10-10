import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import type { FriendActivityItem } from "@/lib/services/activity-service-server";

interface ActivityFeedProps {
  friendActivity: FriendActivityItem[];
}

export function ActivityFeed({ friendActivity }: ActivityFeedProps) {
  return (
    <section className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-600">
        <div>
          <h2 className="text-lg font-semibold text-white">Friend activity</h2>

          <p className="mt-0.5 text-xs text-gray-100">
            Pointless accomplishments your friends have unlocked.
          </p>
        </div>

        <Users className="size-6 text-white" />
      </div>

      {friendActivity.length > 0 ? (
        <div className="max-h-56 divide-y overflow-y-auto">
          {friendActivity.slice(0, 6).map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <Link href={`/profile/${activity.user.username}`}>
                <Avatar className="size-9">
                  <AvatarImage
                    src={activity.user.avatar_url || ""}
                    alt={activity.user.username}
                  />

                  <AvatarFallback className="text-xs">
                    {activity.user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700">
                  <Link
                    href={`/profile/${activity.user.username}`}
                    className="font-semibold hover:text-primary"
                  >
                    {activity.user.username}
                  </Link>{" "}
                  unlocked{" "}
                  <span className="font-medium">
                    {activity.achievement.title}
                  </span>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {activity.achievement.icon_path && (
                <Image
                  src={activity.achievement.icon_path}
                  alt={activity.achievement.title}
                  width={36}
                  height={36}
                  className="size-9 shrink-0 object-contain"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          No friend activity yet.
        </p>
      )}
    </section>
  );
}
