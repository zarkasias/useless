import Link from "next/link";
import { getAchievementPacks } from "@/lib/services/achievement-pack-service-server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AchievementPacksPage() {
  const packs = await getAchievementPacks();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-700">
            Achievement Packs
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage core, seasonal, and special achievement packs.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/achievement-packs/new">Create Pack</Link>
        </Button>
      </div>

      {packs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold text-gray-700">
              No achievement packs yet.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Create your first pack to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {packs.map((pack) => (
            <Card key={pack.id}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{pack.name}</CardTitle>
                <Button asChild variant="outline">
                  <Link href={`/admin/achievement-packs/${pack.id}`}>
                    Edit Pack
                  </Link>
                </Button>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Type:</span> {pack.pack_type}
                </p>

                <p>
                  <span className="font-semibold">Status:</span> {pack.status}
                </p>

                <p>
                  <span className="font-semibold">Slug:</span> {pack.slug}
                </p>

                {pack.description && (
                  <p className="text-muted-foreground">{pack.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
