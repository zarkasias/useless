import Link from "next/link";
import {
  getAdminAchievements,
  type AdminAchievementStatus,
} from "@/lib/services/admin-achievement-service-server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

const statuses: {
  label: string;
  value: AdminAchievementStatus | "all";
}[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export default async function AdminAchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    missingIcon?: string;
    category?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;

  const search = params.q?.trim().toLowerCase() ?? "";

  const requestedStatus = params.status;
  const missingIcon = params.missingIcon === "true";

  const status =
    requestedStatus &&
    requestedStatus !== "all" &&
    ["draft", "review", "published", "archived"].includes(requestedStatus)
      ? (requestedStatus as AdminAchievementStatus)
      : undefined;

  const achievements = await getAdminAchievements(status, missingIcon);

  const filteredAchievements = achievements.filter((achievement) => {
    if (!search) {
      return true;
    }

    return (
      achievement.title.toLowerCase().includes(search) ||
      achievement.description?.toLowerCase().includes(search) ||
      achievement.category?.toLowerCase().includes(search) ||
      achievement.trigger_type?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-700">Achievements</h1>

        <p className="mt-2 text-muted-foreground">
          Review, edit, publish, and archive achievements.
        </p>
      </div>

      <form
        action="/admin/achievements"
        method="GET"
        className="mb-6 flex max-w-md gap-2"
      >
        {status && <input type="hidden" name="status" value={status} />}

        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search achievements..."
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        <Button type="submit">Search</Button>
      </form>

      <div className="mb-8 flex flex-wrap gap-2">
        {statuses.map((item) => {
          const active = item.value === "all" ? !status : status === item.value;

          const linkParams = new URLSearchParams();

          if (item.value !== "all") {
            linkParams.set("status", item.value);
          }

          if (params.q) {
            linkParams.set("q", params.q);
          }

          const queryString = linkParams.toString();

          const href = queryString
            ? `/admin/achievements?${queryString}`
            : "/admin/achievements";

          return (
            <Button
              key={item.value}
              asChild
              variant={active ? "default" : "outline"}
            >
              <Link href={href}>{item.label}</Link>
            </Button>
          );
        })}
      </div>

      {filteredAchievements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold">No achievements found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAchievements
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((achievement) => {
              const pack = Array.isArray(achievement.achievement_packs)
                ? achievement.achievement_packs[0]
                : achievement.achievement_packs;

              return (
                <Card key={achievement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-3xl">
                          {achievement.emoji ?? "🏆"}
                        </div>

                        <CardTitle className="mt-2 text-gray-700">
                          {achievement.title}
                        </CardTitle>
                      </div>

                      <span className="rounded-full border px-3 py-1 text-xs font-bold">
                        {achievement.type}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs justify-start">
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
                        <span className="font-semibold">Generated:</span>{" "}
                        {achievement.generated_by}
                      </p>

                      <p>
                        <span className="font-semibold">Trigger:</span>{" "}
                        {achievement.trigger_type ?? "Legacy"}
                      </p>
                    </div>

                    {achievement.icon_path ? (
                      <p className="text-xs uppercase font-medium text-green-600">
                        Icon assigned
                      </p>
                    ) : (
                      <p className="text-xs uppercase font-medium text-red-500">
                        Icon needed
                      </p>
                    )}

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/admin/achievements/${achievement.id}`}>
                        Edit Achievement
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
