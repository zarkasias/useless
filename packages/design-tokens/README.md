# @useless/design-tokens

Shared design tokens for Useless Achievements.

This package is the source of truth for visual values that should stay consistent across the web app and future mobile apps.

## Current scope

At the moment, this package contains shared achievement rarity colors for:

- Common
- Rare
- Epic
- Legendary
- Secret
- Game

These values are derived from the existing web application styles so the design system stays aligned with the current product.

## Files

### `tokens.json`

Contains platform-neutral design values that can be consumed by:

- Next.js / React
- Storybook
- Flutter
- future tooling or generators

Example:

```json
{
  "color": {
    "rarity": {
      "rare": {
        "borderStart": "#F3F4F6",
        "borderEnd": "#3B82F6",
        "badgeStart": "#3B82F6",
        "badgeEnd": "#60A5FA"
      }
    }
  }
}
```
