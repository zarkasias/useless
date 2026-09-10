import { notFound } from "next/navigation";

import {
  getAchievementPackById,
  getAchievementsForPack,
} from "@/lib/services/achievement-pack-service-server";
import { updateAchievementPack } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { AchievementType } from "@/lib/supabase";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditAchievementPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [pack, achievements] = await Promise.all([
    getAchievementPackById(id),
    getAchievementsForPack(id),
  ]);

  if (!pack) {
    notFound();
  }

  const rarityCounts = achievements.reduce<Record<AchievementType, number>>(
    (counts, achievement) => {
      counts[achievement.type as AchievementType]++;

      return counts;
    },
    {
      COMMON: 0,
      RARE: 0,
      EPIC: 0,
      LEGENDARY: 0,
    },
  );

  function toDateTimeLocalValue(dateString: string) {
    const date = new Date(dateString);

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-8">
        <Link
          href="/admin/achievement-packs"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to achievement packs
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-700">
          Edit Achievement Pack
        </h1>

        <p className="mt-2 text-muted-foreground">
          Update this pack&apos;s settings and availability.
        </p>
      </div>
      <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <form action={updateAchievementPack} className="space-y-6">
          <input type="hidden" name="id" value={pack.id} />

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>

            <Input id="name" name="name" defaultValue={pack.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>

            <Input id="slug" name="slug" defaultValue={pack.slug} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>

            <Textarea
              id="description"
              name="description"
              defaultValue={pack.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pack_type">Pack type</Label>

            <select
              id="pack_type"
              name="pack_type"
              defaultValue={pack.pack_type}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="core">Core</option>
              <option value="seasonal">Seasonal</option>
              <option value="event">Event</option>
              <option value="special">Special</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="cover_image">Pack icon path</Label>

            <Input
              id="cover_image_path"
              name="cover_image_path"
              defaultValue={pack.cover_image_path ?? ""}
              placeholder="/icons/packs/holiday-pack.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme_key">Theme</Label>

            <select
              id="theme_key"
              name="theme_key"
              defaultValue={pack.theme_key ?? "default"}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="default">Default</option>
              <option value="halloween">Halloween</option>
              <option value="holiday">Holiday</option>
              <option value="new_years">New Years</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>

            <select
              id="status"
              name="status"
              defaultValue={pack.status}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts at</Label>

              <Input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                defaultValue={
                  pack.starts_at ? toDateTimeLocalValue(pack.starts_at) : ""
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ends_at">Ends at</Label>

              <Input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                defaultValue={
                  pack.ends_at ? toDateTimeLocalValue(pack.ends_at) : ""
                }
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
        <div className="">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-700">Achievements</h2>

              <p className="text-sm text-muted-foreground">
                {achievements.length} achievement
                {achievements.length === 1 ? "" : "s"} in this pack
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                <span>Common: {rarityCounts.COMMON}</span>
                <span>Rare: {rarityCounts.RARE}</span>
                <span>Epic: {rarityCounts.EPIC}</span>
                <span>Legendary: {rarityCounts.LEGENDARY}</span>
              </div>
            </div>

            {/* <Button asChild>
              <Link href={`/admin/achievements?pack=${pack.id}`}>
                Manage Achievements
              </Link>
            </Button> */}
          </div>

          {achievements.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="font-semibold text-gray-700">
                  No achievements in this pack yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{achievement.title}</p>

                        <span className="text-xs text-muted-foreground">
                          {achievement.type}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {achievement.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>

                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/achievements/${achievement.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
