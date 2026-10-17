import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:mobile/models/achievement.dart';
import 'package:mobile/models/dashboard_data.dart';
import 'package:mobile/utils/date_utils.dart';

class DashboardService {
  DashboardService(this._client);

  final SupabaseClient _client;

  Future<DashboardData> getDashboardData() async {
    final user = _client.auth.currentUser;

    if (user == null) {
      throw StateError('No authenticated user.');
    }

    final results = await Future.wait([
      _client
          .from('profiles')
          .select('username, timezone')
          .eq('id', user.id)
          .single(),
      _client
          .from('user_achievements')
          .select('''
            created_at,
            achievement_date,
            achievements (
              title,
              description,
              type,
              icon_path
            )
          ''')
          .eq('user_id', user.id)
          .order('created_at', ascending: false),
    ]);

    final profile = results[0] as Map<String, dynamic>;
    final rows = results[1] as List<dynamic>;

    final username = profile['username'] as String? ?? 'Your Dashboard';
    final timezone = profile['timezone'] as String? ?? 'UTC';

    final today = getToday(timezone);

    final achievementDates =
        rows
            .map((row) => row['achievement_date'] as String?)
            .whereType<String>()
            .toSet()
            .toList()
          ..sort();

    final claimedToday = achievementDates.contains(today);

    final currentStreak = _calculateCurrentStreak(achievementDates, today);

    final longestStreak = _calculateLongestStreak(achievementDates);

    final recentAchievements = rows
        .take(3)
        .map<Achievement?>((row) {
          final achievement = row['achievements'] as Map<String, dynamic>?;

          if (achievement == null) {
            return null;
          }

          return Achievement(
            title: achievement['title'] as String,
            description: achievement['description'] as String,
            type: AchievementType.values.byName(
              (achievement['type'] as String).toLowerCase(),
            ),
            iconPath: achievement['icon_path'] as String?,
          );
        })
        .whereType<Achievement>()
        .toList();

    return DashboardData(
      username: username,
      currentStreak: currentStreak,
      longestStreak: longestStreak,
      totalAchievements: rows.length,
      claimedToday: claimedToday,
      recentAchievements: recentAchievements,
    );
  }

  int _calculateCurrentStreak(List<String> achievementDates, String today) {
    final dateSet = achievementDates.toSet();

    final yesterday = addDays(today, -1);

    String? streakStartDate;

    if (dateSet.contains(today)) {
      streakStartDate = today;
    } else if (dateSet.contains(yesterday)) {
      streakStartDate = yesterday;
    }

    if (streakStartDate == null) {
      return 0;
    }

    var currentStreak = 0;
    var currentDate = streakStartDate;

    while (dateSet.contains(currentDate)) {
      currentStreak++;
      currentDate = addDays(currentDate, -1);
    }

    return currentStreak;
  }

  int _calculateLongestStreak(List<String> achievementDates) {
    if (achievementDates.isEmpty) {
      return 0;
    }

    var longestStreak = 0;
    var runningStreak = 0;
    String? previousDate;

    for (final date in achievementDates) {
      if (previousDate != null && date == addDays(previousDate, 1)) {
        runningStreak++;
      } else {
        runningStreak = 1;
      }

      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }

      previousDate = date;
    }

    return longestStreak;
  }
}
