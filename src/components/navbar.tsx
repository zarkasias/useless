import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
      <div className="container flex h-16 items-center justify-between relative">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center ml-4 gap-2 group">
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
                    className="relative h-9 w-9 rounded-full p-0 group"
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-primary/20 group-hover:ring-primary transition-all duration-300">
                      <AvatarImage
                        src={user.avatar_url || ""}
                        alt={user.username}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-blue-500/80 text-white">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 border border-primary/20 bg-background/95 backdrop-blur"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground flex items-center gap-1">
                        <span className="text-primary">🔥</span>
                        Current streak:{" "}
                        <span className="font-bold text-primary">
                          {user.streak_count}
                        </span>{" "}
                        days
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild
                    className="hover:bg-primary/10 cursor-pointer"
                  >
                    <Link href="/profile" className="flex items-center gap-2">
                      <span className="text-primary text-lg">👤</span> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="hover:bg-primary/10 cursor-pointer"
                  >
                    <Link
                      href="/leaderboard"
                      className="flex items-center gap-2"
                    >
                      <span className="text-primary text-lg">🏅</span>{" "}
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="hover:bg-destructive/10 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-destructive text-lg">🚪</span>{" "}
                      Logout
                    </span>
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
