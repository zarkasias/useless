import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminAchievementById } from "@/lib/services/admin-achievement-service-server";
import { getAchievementPacks } from "@/lib/services/achievement-pack-service-server";

import {
  updateAdminAchievement,
  publishAdminAchievement,
  archiveAdminAchievement,
  returnAchievementToDraft,
} from "../actions";

import { ACHIEVEMENT_CATEGORY_OPTIONS } from "@/lib/achievements/category-options";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyTextButton } from "@/components/admin/copy-text-button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAchievementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [achievement, packs] = await Promise.all([
    getAdminAchievementById(id),
    getAchievementPacks(),
  ]);

  if (!achievement) {
    notFound();
  }

  const pack = Array.isArray(achievement.achievement_packs)
    ? achievement.achievement_packs[0]
    : achievement.achievement_packs;

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-8">
        <Link
          href="/admin/achievements"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to achievements
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-700">
          Edit Achievement
        </h1>

        <p className="mt-2 text-muted-foreground">
          Review the generated content, add the icon, and publish when ready.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-700">{achievement.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <form action={updateAdminAchievement} className="space-y-6">
              <input type="hidden" name="id" value={achievement.id} />

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>

                <Input
                  id="title"
                  name="title"
                  defaultValue={achievement.title}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>

                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={achievement.description}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Rarity</Label>

                  <select
                    id="type"
                    name="type"
                    defaultValue={achievement.type}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="COMMON">Common</option>
                    <option value="RARE">Rare</option>
                    <option value="EPIC">Epic</option>
                    <option value="LEGENDARY">Legendary</option>
                    <option value="SECRET">Secret</option>
                    <option value="GAME">Game</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emoji">Emoji</Label>

                  <Input
                    id="emoji"
                    name="emoji"
                    defaultValue={achievement.emoji ?? ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>

                <select
                  id="category"
                  name="category"
                  defaultValue={achievement.category ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Uncategorized</option>
                  {ACHIEVEMENT_CATEGORY_OPTIONS.map((option) => (
                    <option
                      key={option.value || "uncategorized"}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pack_id">Achievement Pack</Label>

                <select
                  id="pack_id"
                  name="pack_id"
                  defaultValue={achievement.pack_id ?? ""}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">No pack</option>

                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>

                <select
                  id="status"
                  name="status"
                  defaultValue={achievement.status}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon_path">Icon path</Label>

                <Input
                  id="icon_path"
                  name="icon_path"
                  placeholder="/achievement_icons/webp/example.webp"
                  defaultValue={achievement.icon_path ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Example: /achievement_icons/webp/daily-little-treat.webp
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="icon_concept">Icon concept</Label>

                  {achievement.icon_concept && (
                    <CopyTextButton
                      text={achievement.icon_concept}
                      label="Copy concept"
                    />
                  )}
                </div>

                <Textarea
                  id="icon_concept"
                  name="icon_concept"
                  rows={3}
                  defaultValue={achievement.icon_concept ?? ""}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="image_prompt">Image prompt</Label>

                  {achievement.image_prompt && (
                    <CopyTextButton
                      text={achievement.image_prompt}
                      label="Copy prompt"
                    />
                  )}
                </div>

                <Textarea
                  id="image_prompt"
                  name="image_prompt"
                  rows={8}
                  defaultValue={achievement.image_prompt ?? ""}
                />
              </div>

              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Achievement Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {achievement.status}
              </p>

              <p>
                <span className="font-semibold">Category:</span>{" "}
                {achievement.category ?? "Uncategorized"}
              </p>

              <p>
                <span className="font-semibold">Pack:</span>{" "}
                {pack?.name ?? "Unassigned"}
              </p>

              <p>
                <span className="font-semibold">Generated by:</span>{" "}
                {achievement.generated_by}
              </p>

              <p>
                <span className="font-semibold">Trigger:</span>{" "}
                {achievement.trigger_type ?? "None"}
              </p>

              <p>
                <span className="font-semibold">Daily:</span>{" "}
                {achievement.is_daily ? "Yes" : "No"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trigger Config</CardTitle>
            </CardHeader>

            <CardContent>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(achievement.trigger_config, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Achievement Icon</CardTitle>
            </CardHeader>

            <CardContent>
              {achievement.icon_path ? (
                <div className="space-y-3">
                  <div className="flex justify-center rounded-2xl border bg-muted/20 p-4">
                    <Image
                      src={achievement.icon_path}
                      alt={`${achievement.title} icon`}
                      width={160}
                      height={160}
                      className="size-40 object-contain"
                    />
                  </div>

                  <p className="text-center text-sm font-medium text-green-600">
                    Icon ready
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center">
                  <p className="font-semibold">Icon needed</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate the icon manually and add its path before
                    publishing.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Achievement Status</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Current status</p>

                <p className="mt-1 text-sm capitalize text-muted-foreground">
                  {achievement.status}
                </p>
              </div>

              {achievement.status !== "published" &&
                achievement.status !== "archived" && (
                  <div className="space-y-2">
                    {!achievement.icon_path && (
                      <p className="text-sm text-amber-600">
                        Add an icon path before publishing.
                      </p>
                    )}

                    <form action={publishAdminAchievement}>
                      <input type="hidden" name="id" value={achievement.id} />

                      <Button
                        type="submit"
                        disabled={!achievement.icon_path}
                        className="w-full"
                      >
                        Publish Achievement
                      </Button>
                    </form>
                  </div>
                )}

              {achievement.status === "published" && (
                <form action={returnAchievementToDraft}>
                  <input type="hidden" name="id" value={achievement.id} />

                  <Button type="submit" variant="outline" className="w-full">
                    Return to Draft
                  </Button>
                </form>
              )}

              {achievement.status === "archived" && (
                <form action={returnAchievementToDraft}>
                  <input type="hidden" name="id" value={achievement.id} />

                  <Button type="submit" variant="outline" className="w-full">
                    Restore as Draft
                  </Button>
                </form>
              )}

              {achievement.status !== "archived" && (
                <form action={archiveAdminAchievement}>
                  <input type="hidden" name="id" value={achievement.id} />

                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                  >
                    Archive Achievement
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
