const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getAchievementIconUrl(
  iconPath: string | null | undefined,
): string | null {
  if (!iconPath) return null;

  if (!SUPABASE_URL) {
    return iconPath;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/achievement-assets${iconPath}`;
}
