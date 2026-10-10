"use client";

import Link from "next/link";

import { Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { UserProfile } from "@/lib/supabase";
import type { FriendListItem } from "@/lib/services/friend-service-server";
import { Navbar } from "@/components/navbar";

interface FriendsClientProps {
  user: UserProfile;
  friends: FriendListItem[];
}

export function FriendsClient({ user, friends }: FriendsClientProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-700 dark:text-gray-200">
            Friends
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            People you&apos;ve decided to be unnecessarily social with.
          </p>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-md border bg-background p-8 text-center shadow-sm">
            <Users className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium text-gray-700 dark:text-gray-200">
              No friends yet
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Visit the leaderboard to find someone to add.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map(({ friendshipId, friend }) => {
              const initials = friend.username.slice(0, 2).toUpperCase();

              return (
                <Link
                  key={friendshipId}
                  href={`/profile/${friend.username}`}
                  className="group rounded-lg border bg-background p-4 shadow-sm transition hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarImage
                        src={friend.avatar_url || ""}
                        alt={friend.username}
                      />

                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-700 group-hover:text-primary dark:text-gray-200">
                        {friend.username}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        View profile
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
