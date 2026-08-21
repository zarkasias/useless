import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut, Medal, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "@/lib/supabase";

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-3xl transition-transform duration-500 ease-in-out group-hover:rotate-12 group-hover:scale-110"
              role="img"
              aria-label="trophy"
            >
              <img src="/icons/trophy.png" alt="trophy" className="w-8 h-8" />
            </span>
            <span className="hidden font-bold sm:inline-block relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 text-xl">
                Useless Achievements
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-500 group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  Dashboard
                </Button>
              </Link>

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

                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <span className="hidden max-w-32 truncate text-sm font-medium text-gray-700 md:block dark:text-gray-200">
                      {user.username}
                    </span>

                    <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <User className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/leaderboard"
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Medal className="size-4" />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
