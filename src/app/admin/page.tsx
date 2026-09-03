import Link from "next/link";

import {
  Archive,
  Bot,
  Boxes,
  ImageOff,
  Plus,
  Sparkles,
  Trophy,
} from "lucide-react";

import { getAdminDashboardStats } from "@/lib/services/admin-achievement-service-server";
import { getAchievementPackCount } from "@/lib/services/achievement-pack-service-server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const [stats, packCount] = await Promise.all([
    getAdminDashboardStats(),
    getAchievementPackCount(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-700">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-muted-foreground">
          Manage achievement content, packs, and AI-generated drafts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Link href="/admin/achievements?status=draft">
          <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="size-6 text-purple-500" />
                Drafts
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-black">{stats.drafts}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/achievements?status=published">
          <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="size-6 text-amber-400" />
                Published
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-black">{stats.published}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/achievements?status=archived">
          <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Archive className="size-6 text-gray-600" />
                Archived
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-black">{stats.archived}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/achievements?missingIcon=true">
          <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ImageOff className="size-6 text-red-400" />
                Missing Icons
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-black">{stats.missingIcons}</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="size-6 text-green-600" />
              AI Generated
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-black">{stats.aiGenerated}</p>
          </CardContent>
        </Card>

        <Link href="/admin/achievement-packs">
          <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Boxes className="size-6 text-blue-600" />
                Packs
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-black">{packCount}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Manage Achievements</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review drafts, edit achievement details, assign icons, publish,
              and archive achievements.
            </p>

            <Button asChild className="w-full">
              <Link href="/admin/achievements">View Achievements</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievement Packs</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage core, seasonal, event, and special achievement packs.
            </p>

            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/achievement-packs">Manage Packs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Achievements</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate new AI-assisted achievement drafts for any pack.
            </p>

            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/achievement-generator">
                <Plus className="mr-2 size-4" />
                Generate Drafts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
