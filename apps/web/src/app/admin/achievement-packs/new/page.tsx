import { createAchievementPack } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewAchievementPackPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-700">
          Create Achievement Pack
        </h1>

        <p className="mt-2 text-muted-foreground">
          Create a container for core, seasonal, or special achievements.
        </p>
      </div>

      <form action={createAchievementPack} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>

          <Input id="name" name="name" placeholder="Halloween 2026" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>

          <Input id="slug" name="slug" placeholder="halloween-2026" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>

          <Textarea
            id="description"
            name="description"
            placeholder="A spooky collection of useless seasonal achievements."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pack_type">Pack type</Label>

          <select
            id="pack_type"
            name="pack_type"
            defaultValue="seasonal"
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
            defaultValue="draft"
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

            <Input id="starts_at" name="starts_at" type="datetime-local" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ends_at">Ends at</Label>

            <Input id="ends_at" name="ends_at" type="datetime-local" />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Create Pack
        </Button>
      </form>
    </main>
  );
}
