import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:mobile/models/achievement.dart';
import 'package:mobile/services/user_achievement_service.dart';
import 'package:mobile/widgets/achievement_card.dart';

class CollectionScreen extends StatefulWidget {
  const CollectionScreen({super.key});

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  late final UserAchievementService _achievementService;
  late Future<List<Achievement>> _achievementsFuture;

  @override
  void initState() {
    super.initState();

    _achievementService = UserAchievementService(Supabase.instance.client);

    _achievementsFuture = _achievementService.getCollectedAchievements();
  }

  Future<void> _refreshAchievements() async {
    final future = _achievementService.getCollectedAchievements();

    setState(() {
      _achievementsFuture = future;
    });

    await future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: FutureBuilder<List<Achievement>>(
          future: _achievementsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }

            if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'Unable to load your achievements.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _refreshAchievements,
                        child: const Text('Try again'),
                      ),
                    ],
                  ),
                ),
              );
            }

            final achievements = snapshot.data ?? [];

            if (achievements.isEmpty) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'You haven\'t collected any achievements yet.',
                    textAlign: TextAlign.center,
                  ),
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: _refreshAchievements,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                itemCount: achievements.length,
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (context, index) {
                  return AchievementCard(achievement: achievements[index]);
                },
              ),
            );
          },
        ),
      ),
    );
  }
}
