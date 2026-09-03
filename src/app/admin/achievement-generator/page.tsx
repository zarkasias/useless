import { testGenerateAchievements } from "./actions";

export default function AchievementGeneratorPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">Achievement Generator</h1>

      <p className="mt-2 text-muted-foreground">
        Temporary AI generation test.
      </p>

      <form action={testGenerateAchievements} className="mt-8">
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white"
        >
          Generate Test Achievements
        </button>
      </form>
    </main>
  );
}
