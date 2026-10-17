import 'package:flutter/material.dart';
import 'package:mobile/design/design_tokens.g.dart';
import 'package:mobile/models/achievement.dart';
import 'package:mobile/utils/achievment_icon_url.dart';

import 'achievement_button.dart';

enum AchievementCardVariant { standard, compact }

class AchievementCard extends StatelessWidget {
  const AchievementCard({
    super.key,
    required this.achievement,
    this.variant = AchievementCardVariant.standard,
  });

  final Achievement achievement;
  final AchievementCardVariant variant;

  bool get isCompact => variant == AchievementCardVariant.compact;

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

    final cardPadding = isCompact
        ? const EdgeInsets.fromLTRB(10, 10, 10, 8)
        : const EdgeInsets.fromLTRB(12, 12, 12, 8);

    final badgeHorizontalPadding = isCompact ? 8.0 : 10.0;
    final badgeVerticalPadding = isCompact ? 3.0 : 4.0;

    final titleFontSize = isCompact
        ? 14.0
        : AchievementCardTokens.titleFontSize;

    final descriptionFontSize = isCompact
        ? 11.0
        : AchievementCardTokens.descriptionFontSize;

    final iconContainerSize = isCompact
        ? 76.0
        : AchievementCardTokens.iconContainerSize;

    final iconSize = isCompact ? 68.0 : AchievementCardTokens.iconSize;

    final iconOffset = isCompact
        ? const Offset(10, -10)
        : const Offset(14, -14);

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
        padding: cardPadding,
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
                        padding: EdgeInsets.symmetric(
                          horizontal: badgeHorizontalPadding,
                          vertical: badgeVerticalPadding,
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
                            fontSize: isCompact
                                ? 10
                                : AchievementCardTokens.badgeFontSize,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),

                      SizedBox(height: isCompact ? 4 : 6),

                      Text(
                        achievement.title,
                        maxLines: isCompact ? 1 : 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: titleFontSize,
                          fontWeight: FontWeight.w600,
                          color: AchievementCardTokens.titleColorLight,
                        ),
                      ),

                      SizedBox(height: isCompact ? 2 : 4),

                      Text(
                        achievement.description,
                        maxLines: isCompact ? 2 : null,
                        overflow: isCompact
                            ? TextOverflow.ellipsis
                            : TextOverflow.visible,
                        style: TextStyle(
                          fontSize: descriptionFontSize,
                          fontWeight: FontWeight.w400,
                          color: AchievementCardTokens.descriptionColorLight,
                        ),
                      ),
                    ],
                  ),
                ),

                Transform.translate(
                  offset: iconOffset,
                  child: SizedBox(
                    width: iconContainerSize,
                    height: iconContainerSize,
                    child: Center(
                      child: SizedBox(
                        width: iconSize,
                        height: iconSize,
                        child: iconUrl != null
                            ? Image.network(iconUrl, fit: BoxFit.contain)
                            : Icon(
                                Icons.emoji_events_outlined,
                                size: isCompact ? 42 : null,
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            if (!isCompact) ...[
              const SizedBox(height: 8),
              const Divider(height: 1),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: AchievementShareButton(onPressed: () {}),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
