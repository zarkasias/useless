# Tailwind Profile

Applies only when selected in the project profile. Extends the
[core standards](../engineering-standards.md); it does not mandate Tailwind
for unrelated applications.

## Styling

- **Primary approach:** Tailwind MUST be the primary styling approach.
- **Other styling systems:** Do not introduce CSS Modules or another styling
  library without an owner decision.
- **Utility placement:** Keep utilities close to the markup they style.
- **Theme tokens:** Use existing tokens where appropriate. Arbitrary values
  SHOULD cover requirements absent from the theme; repeated shared values
  SHOULD become tokens.
- **Class detection:** Utilities MUST appear as complete strings. Do not
  construct classes such as `bg-${color}-500`.
- **Conditional styles:** Use the existing class-name helper when available.
- **Visual variants:** Multiple supported variants SHOULD use explicit mappings.
  Do not add a variant library for a simple conditional style.
- **Class order:** MUST follow the configured formatter.

## Reuse and Custom CSS

- **UI patterns:** Reuse meaningful components; do not extract one solely to
  shorten a `className`.
- **`@apply` usage:** SHOULD NOT be the default reuse mechanism.
- **Global CSS:** MAY contain framework setup, tokens, resets, and styles not
  reasonably expressed with utilities.
- **Inline styles:** MAY carry values calculated at runtime.
- **Custom selectors:** Class names MUST describe purpose; selectors SHOULD
  remain shallow.
- **Custom values:** Use theme tokens instead of duplicating values.
- **`!important`:** Requires a documented reason.
- **Interactive states:** Follow core accessibility requirements.
- **CSS migration:** Follow the [workflow](../workflow.md); existing stylesheets
  are not automatically exempt.
