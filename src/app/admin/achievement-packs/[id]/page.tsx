import { notFound } from "next/navigation";
import { getAchievementPackById } from "@/lib/services/achievement-pack-service-server";
import { updateAchievementPack } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function EditAchievementPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pack = await getAchievementPackById(id);

  if (!pack) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black">Edit Achievement Pack</h1>

        <p className="mt-2 text-muted-foreground">
          Update this pack&apos;s settings and availability.
        </p>
      </div>

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
                pack.starts_at
                  ? new Date(pack.starts_at).toISOString().slice(0, 16)
                  : ""
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
                pack.ends_at
                  ? new Date(pack.ends_at).toISOString().slice(0, 16)
                  : ""
              }
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Save Changes
        </Button>
      </form>
    </main>
  );
}
