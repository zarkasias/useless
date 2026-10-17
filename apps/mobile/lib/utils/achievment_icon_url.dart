const supabaseUrl = String.fromEnvironment('SUPABASE_URL');

String? getAchievementIconUrl(String? iconPath) {
  if (iconPath == null || iconPath.isEmpty) {
    return null;
  }

  final normalizedPath = iconPath.replaceFirst(RegExp(r'^/+'), '');

  return '$supabaseUrl/storage/v1/object/public/achievement-assets/$normalizedPath';
}
