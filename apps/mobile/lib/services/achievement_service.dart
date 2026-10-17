import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:mobile/models/achievement.dart';

class AchievementService {
  AchievementService(this._client);

  final SupabaseClient _client;

  Future<List<Achievement>> getAchievements() async {
    final rows = await _client
        .from('achievements')
        .select('title, description, type, icon_path')
        .order('created_at', ascending: false);

    return rows.map<Achievement>((row) {
      return Achievement(
        title: row['title'] as String,
        description: row['description'] as String,
        type: AchievementType.values.byName(
          (row['type'] as String).toLowerCase(),
        ),
        iconPath: row['icon_path'] as String?,
      );
    }).toList();
  }
}
