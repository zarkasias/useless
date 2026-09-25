"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";
import Image from "next/image";
import {
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
  Trophy,
  Medal,
  Sparkles,
  Package,
  Users,
  User,
  Shield,
  Gamepad2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "@/lib/supabase";
import { NotificationCenter } from "@/components/notifications/notification-center";

interface NavbarProps {
  user: UserProfile | null;
  isSubscribed?: boolean;
  billingInterval?: string | null;
  subscriptionStatus?: string | null;
}

export function Navbar({
  user,
  isSubscribed = false,
  subscriptionStatus = null,
}: NavbarProps) {
  const pathname = usePathname();

  const hasBillingIssue = subscriptionStatus === "past_due";

  const isProPage = pathname === "/pro" || pathname.startsWith("/pro/");

  const role = user?.role || "user";

  const subscriptionLabel = hasBillingIssue
    ? "Billing issue"
    : isSubscribed
      ? "Subscription"
      : "Subscribe";

  const handleLogout = async () => {
    await logout();
  };

  const getNavButtonClass = (href: string) => {
    const isLeaderboardSection =
      href === "/leaderboard" &&
      (pathname === "/leaderboard" || pathname.startsWith("/profile/"));

    const isActive =
      isLeaderboardSection ||
      pathname === href ||
      pathname.startsWith(`${href}/`);

    return `
      transition-all duration-200 text-xs
      ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-gray-600 hover:bg-primary/10 hover:text-primary"
      }
    `;
  };
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/05 backdrop-blur supports-[backdrop-filter]:bg-background/05">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1 group">
            <span
              className="text-3xl transition-transform duration-500 ease-in-out group-hover:rotate-16 group-hover:scale-110"
              role="img"
              aria-label="trophy"
            >
              <Image
                src="/icons/golden_trophy.webp"
                alt="trophy"
                width={40}
                height={40}
                className="w-12 h-12"
              />
            </span>
            <span className="hidden font-bold sm:inline-block relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 text-xl">
                Useless Achievements
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-500 group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className={getNavButtonClass("/dashboard")}
                  >
                    Dashboard
                  </Button>
                </Link>

                <Link href="/collection">
                  <Button
                    variant="ghost"
                    className={getNavButtonClass("/collection")}
                  >
                    Collection
                  </Button>
                </Link>

                <Link href="/games">
                  <Button
                    variant="ghost"
                    className={getNavButtonClass("/games")}
                  >
                    Games
                  </Button>
                </Link>

                <Link href="/leaderboard">
                  <Button
                    variant="ghost"
                    className={getNavButtonClass("/leaderboard")}
                  >
                    Leaderboard
                  </Button>
                </Link>

                <Link href="/packs">
                  <Button
                    variant="ghost"
                    className={getNavButtonClass("/packs")}
                  >
                    Packs
                  </Button>
                </Link>
              </div>

              <Link href="/pro">
                <Button
                  variant="ghost"
                  className={
                    hasBillingIssue
                      ? "flex gap-2 border border-amber-300 bg-amber-50 font-semibold text-amber-700 hover:bg-amber-100"
                      : isProPage
                        ? "flex gap-2 bg-muted text-gray-700 font-medium hover:bg-muted text-xs"
                        : "flex gap-2 bg-gradient-to-r from-blue-600 to-violet-600 font-semibold text-xs text-white shadow-sm hover:opacity-90"
                  }
                >
                  <Sparkles
                    className={
                      hasBillingIssue
                        ? "size-4 text-amber-500"
                        : isProPage
                          ? "size-4 text-primary"
                          : "size-4 text-pink-100/80"
                    }
                  />

                  {subscriptionLabel}
                </Button>
              </Link>

              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 gap-2 rounded-lg px-2 hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    >
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage
                          src={user.avatar_url || ""}
                          alt={user.username}
                        />

                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <span className="hidden max-w-32 truncate text-xs font-medium text-gray-700 md:block dark:text-gray-200">
                        {user.username}
                      </span>

                      <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    {/* Mobile-only navigation */}
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/collection">
                        <Trophy className="size-4" />
                        Collection
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/games">
                        <Gamepad2 className="size-4" />
                        Games
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/leaderboard">
                        <Medal className="size-4" />
                        Leaderboard
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/packs">
                        <Package className="size-4" />
                        Packs
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="md:hidden" />

                    {role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <Shield className="size-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <User className="size-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/friends"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Users className="size-4" />
                        Friends
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Settings className="size-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <NotificationCenter enabled />
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-all duration-300 text-white border-0">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
