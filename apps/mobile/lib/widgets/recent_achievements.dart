import 'package:flutter/material.dart';
import 'package:mobile/models/achievement.dart';
import 'package:mobile/widgets/achievement_card.dart';

class RecentAchievements extends StatelessWidget {
  const RecentAchievements({
    super.key,
    required this.achievements,
    required this.onViewCollection,
  });

  final List<Achievement> achievements;
  final VoidCallback onViewCollection;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Recent achievements',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.25,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          'Your latest completely unnecessary accomplishments.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 16),

        if (achievements.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.outlineVariant),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.emoji_events_outlined,
                  size: 32,
                  color: colors.onSurfaceVariant,
                ),
                const SizedBox(height: 10),
                Text(
                  'No achievements yet',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Claim your first achievement to start your collection.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          )
        else ...[
          ...achievements.map(
            (achievement) => Padding(
              padding: const EdgeInsets.only(left: 4, right: 4, bottom: 12),
              child: AchievementCard(
                achievement: achievement,
                variant: AchievementCardVariant.compact,
              ),
            ),
          ),

          const SizedBox(height: 4),

          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onViewCollection,
              icon: const Icon(Icons.arrow_forward),
              label: const Text('View collection'),
            ),
          ),
        ],
      ],
    );
  }
}
