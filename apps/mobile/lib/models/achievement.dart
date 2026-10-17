enum AchievementType { common, rare, epic, legendary, secret, game }

class Achievement {
  const Achievement({
    required this.title,
    required this.description,
    required this.type,
    required this.iconPath,
  });

  final String title;
  final String description;
  final AchievementType type;
  final String? iconPath;
}
