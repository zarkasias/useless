"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Achievements",
    href: "/admin/achievements",
  },
  {
    label: "Packs",
    href: "/admin/achievement-packs",
  },
  {
    label: "Generator",
    href: "/admin/achievement-generator",
  },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  }
  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          size="sm"
          variant={isActive(item.href) ? "default" : "ghost"}
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}

      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard">Exit Admin</Link>
      </Button>
    </nav>
  );
}
