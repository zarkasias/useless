import 'package:mobile/models/achievement.dart';

class DashboardData {
  const DashboardData({
    required this.username,
    required this.currentStreak,
    required this.longestStreak,
    required this.totalAchievements,
    required this.claimedToday,
    required this.today,
    required this.recentAchievements,
  });

  final String username;
  final int currentStreak;
  final int longestStreak;
  final int totalAchievements;
  final bool claimedToday;
  final String today;
  final List<Achievement> recentAchievements;
}
