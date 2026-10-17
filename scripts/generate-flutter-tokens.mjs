import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const tokensPath = path.join(root, "packages/design-tokens/tokens.json");

const outputPath = path.join(
  root,
  "apps/mobile/lib/design/design_tokens.g.dart",
);

const tokens = JSON.parse(fs.readFileSync(tokensPath, "utf8"));

const rarity = tokens.color.rarity;
const brand = tokens.color.brand;
const card = tokens.component.achievementCard;

function hexToDartColor(hex) {
  const normalized = hex.replace("#", "");
  return `Color(0xFF${normalized})`;
}

function rgbaToDartColor(value) {
  const match = value.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);

  if (!match) {
    throw new Error(`Unsupported rgba value: ${value}`);
  }

  const [, r, g, b, a] = match;

  return `Color.fromRGBO(${r}, ${g}, ${b}, ${a})`;
}

function dartColor(value) {
  if (value.startsWith("#")) {
    return hexToDartColor(value);
  }

  if (value.startsWith("rgba")) {
    return rgbaToDartColor(value);
  }

  throw new Error(`Unsupported color value: ${value}`);
}

const rarityEntries = Object.entries(rarity)
  .map(([name, values]) => {
    return `
  static const ${name} = AchievementRarityColors(
    borderStart: ${dartColor(values.borderStart)},
    borderEnd: ${dartColor(values.borderEnd)},
    badgeStart: ${dartColor(values.badgeStart)},
    badgeEnd: ${dartColor(values.badgeEnd)},
    sparkleA: ${dartColor(values.sparkleA)},
    sparkleB: ${dartColor(values.sparkleB)},
    medallionMid: ${dartColor(values.medallionMid)},
  );`;
  })
  .join("\n");

const output = `
// GENERATED FILE - DO NOT EDIT

import 'package:flutter/material.dart';

class AchievementRarityColors {
  final Color borderStart;
  final Color borderEnd;
  final Color badgeStart;
  final Color badgeEnd;
  final Color sparkleA;
  final Color sparkleB;
  final Color medallionMid;

  const AchievementRarityColors({
    required this.borderStart,
    required this.borderEnd,
    required this.badgeStart,
    required this.badgeEnd,
    required this.sparkleA,
    required this.sparkleB,
    required this.medallionMid,
  });
}

abstract final class AchievementRarityTokens {
${rarityEntries}
}

abstract final class BrandTokens {
  static const Color primary =
      ${dartColor(brand.primaryGradient.start)};

  static const Color secondary =
      ${dartColor(brand.primaryGradient.end)};

  static const Color titleAccent =
      ${dartColor(brand.titleGradient.end)};

  static const Color focus =
      ${dartColor(brand.focus)};
}

abstract final class AchievementCardTokens {
  static const double radius = ${card.radius};
  static const double outerRadius = ${card.outerRadius};
  static const double borderWidth = ${card.borderWidth};

  static const Color surfaceLight =
      ${dartColor(card.surface.light)};

  static const Color surfaceDark =
      ${dartColor(card.surface.dark)};

      static const Color dashboardStats =
      ${dartColor(card.surface.dashboardStats)};

  static const double titleFontSize = ${card.title.fontSize};
  static const int titleFontWeight = ${card.title.fontWeight};

  static const double descriptionFontSize =
      ${card.description.fontSize};

  static const int descriptionFontWeight =
      ${card.description.fontWeight};

  static const double badgeRadius = ${card.badge.radius};
  static const double badgeFontSize = ${card.badge.fontSize};

  static const double iconContainerSize =
    ${card.icon.containerSize};

static const double iconSize =
    ${card.icon.size};
  static const double fallbackIconSize =
      ${card.icon.fallbackSize};

      static const Color titleColorLight =
    ${dartColor(card.title.colorLight)};

static const Color titleColorDark =
    ${dartColor(card.title.colorDark)};

static const Color descriptionColorLight =
    ${dartColor(card.description.colorLight)};

static const Color descriptionColorDark =
    ${dartColor(card.description.colorDark)};

static const Color shareIconColor = ${dartColor(card.share.icon)};

static const Color shareTextStart = ${dartColor(card.share.textStart)};

static const Color shareTextEnd = ${dartColor(card.share.textEnd)};

static const double shareIconSize = ${card.share.iconSize};

static const int shareFontWeight = ${card.share.fontWeight};
}
`;

fs.writeFileSync(outputPath, output.trimStart());

console.log(`Generated ${outputPath}`);
