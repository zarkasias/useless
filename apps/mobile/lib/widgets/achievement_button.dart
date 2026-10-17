import 'package:flutter/material.dart';
import 'package:mobile/design/design_tokens.g.dart';

class AchievementShareButton extends StatelessWidget {
  const AchievementShareButton({
    super.key,
    required this.onPressed,
    this.isLoading = false,
    this.isEnabled = true,
  });

  final VoidCallback onPressed;
  final bool isLoading;
  final bool isEnabled;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: isEnabled && !isLoading ? onPressed : null,
      style: TextButton.styleFrom(
        padding: EdgeInsets.zero,
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isLoading)
            SizedBox(
              width: AchievementCardTokens.shareIconSize,
              height: AchievementCardTokens.shareIconSize,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AchievementCardTokens.shareIconColor,
              ),
            )
          else
            Icon(
              Icons.share_outlined,
              size: AchievementCardTokens.shareIconSize,
              color: AchievementCardTokens.shareIconColor,
            ),

          const SizedBox(width: 8),

          ShaderMask(
            shaderCallback: (bounds) {
              return const LinearGradient(
                colors: [
                  AchievementCardTokens.shareTextStart,
                  AchievementCardTokens.shareTextEnd,
                ],
              ).createShader(bounds);
            },
            child: Text(
              'Share',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
