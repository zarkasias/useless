import 'package:flutter/material.dart';
import 'package:mobile/design/design_tokens.g.dart';
import 'package:mobile/models/achievement.dart';
import 'package:mobile/utils/achievment_icon_url.dart';

import 'achievement_button.dart';

class AchievementCard extends StatelessWidget {
  const AchievementCard({super.key, required this.achievement});

  final Achievement achievement;

  @override
  Widget build(BuildContext context) {
    final rarity = switch (achievement.type) {
      AchievementType.common => AchievementRarityTokens.common,
      AchievementType.rare => AchievementRarityTokens.rare,
      AchievementType.epic => AchievementRarityTokens.epic,
      AchievementType.legendary => AchievementRarityTokens.legendary,
      AchievementType.secret => AchievementRarityTokens.secret,
      AchievementType.game => AchievementRarityTokens.game,
    };

    final iconUrl = getAchievementIconUrl(achievement.iconPath);

    return Container(
      padding: EdgeInsets.all(AchievementCardTokens.borderWidth),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AchievementCardTokens.outerRadius),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [rarity.borderStart, rarity.borderEnd],
        ),
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
        decoration: BoxDecoration(
          color: AchievementCardTokens.surfaceLight,
          borderRadius: BorderRadius.circular(AchievementCardTokens.radius),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(
                            AchievementCardTokens.badgeRadius,
                          ),
                          gradient: LinearGradient(
                            colors: [rarity.badgeStart, rarity.badgeEnd],
                          ),
                        ),
                        child: Text(
                          achievement.type.name.toUpperCase(),
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: AchievementCardTokens.badgeFontSize,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        achievement.title,
                        style: TextStyle(
                          fontSize: AchievementCardTokens.titleFontSize,
                          fontWeight: FontWeight.w600,
                          color: AchievementCardTokens.titleColorLight,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        achievement.description,
                        style: TextStyle(
                          fontSize: AchievementCardTokens.descriptionFontSize,
                          fontWeight: FontWeight.w400,
                          color: AchievementCardTokens.descriptionColorLight,
                        ),
                      ),
                    ],
                  ),
                ),
                Transform.translate(
                  offset: const Offset(14, -14),
                  child: SizedBox(
                    width: AchievementCardTokens.iconContainerSize,
                    height: AchievementCardTokens.iconContainerSize,
                    child: Center(
                      child: SizedBox(
                        width: AchievementCardTokens.iconSize,
                        height: AchievementCardTokens.iconSize,
                        child: iconUrl != null
                            ? Image.network(iconUrl, fit: BoxFit.contain)
                            : const Icon(Icons.emoji_events_outlined),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: AchievementShareButton(onPressed: () {}),
            ),
          ],
        ),
      ),
    );
  }
}
