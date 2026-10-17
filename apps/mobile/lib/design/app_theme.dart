import 'package:flutter/material.dart';
import 'package:mobile/design/design_tokens.g.dart';

abstract final class AppTheme {
  static ThemeData get light {
    return ThemeData(
      useMaterial3: true,

      scaffoldBackgroundColor: Colors.white,

      colorScheme: const ColorScheme.light(
        primary: BrandTokens.primary,
        secondary: BrandTokens.secondary,
        surface: Colors.white,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AchievementCardTokens.titleColorLight,
        error: Color(0xFFDC2626),
      ),

      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AchievementCardTokens.titleColorLight,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: BrandTokens.primary.withValues(alpha: 0.12),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: BrandTokens.primary);
          }

          return const IconThemeData(
            color: AchievementCardTokens.descriptionColorLight,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return TextStyle(
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w600
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? BrandTokens.primary
                : AchievementCardTokens.descriptionColorLight,
          );
        }),
      ),

      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: BrandTokens.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: BrandTokens.focus, width: 2),
        ),
      ),

      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: BrandTokens.primary,
      ),
    );
  }
}
