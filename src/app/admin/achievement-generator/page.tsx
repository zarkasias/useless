import { AchievementGeneratorForm } from "@/components/admin/achievement-generator-form";
import { getAchievementPacks } from "@/lib/services/achievement-pack-service-server";

export default async function AchievementGeneratorPage() {
  const packs = await getAchievementPacks();
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-700">
          Achievement Generator
        </h1>

        <p className="mt-2 text-muted-foreground">
          Generate achievement drafts for a selected pack.
        </p>
      </div>

      <AchievementGeneratorForm packs={packs} />
    </main>
  );
}
