import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:mobile/models/achievement.dart';

class UserAchievementService {
  UserAchievementService(this._client);

  final SupabaseClient _client;

  Future<List<Achievement>> getCollectedAchievements() async {
    final user = _client.auth.currentUser;

    if (user == null) {
      throw StateError('No authenticated user.');
    }

    final rows = await _client
        .from('user_achievements')
        .select('''
          created_at,
          achievements (
            title,
            description,
            type,
            icon_path
          )
        ''')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    return rows.map<Achievement>((row) {
      final achievement = row['achievements'] as Map<String, dynamic>;

      return Achievement(
        title: achievement['title'] as String,
        description: achievement['description'] as String,
        type: AchievementType.values.byName(
          (achievement['type'] as String).toLowerCase(),
        ),
        iconPath: achievement['icon_path'] as String?,
      );
    }).toList();
  }
}
