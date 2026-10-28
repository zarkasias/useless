# Useless Guess Engineering Exceptions

These narrow departures implement the owner's explicit 2026-10-28 instruction to
preserve existing repository conventions. They do not modify reusable standards.
Applies only to Useless Guess and its minimal integration changes, through feature
acceptance; reassess in its final handoff. No unrelated migration is authorized.

## UG-01: Existing component filenames and separate tests

- **Rules:** [React/TypeScript Organization and Tests](profiles/react-typescript.md):
  PascalCase component folders and tests beside components/logic; helpers in `src/test/`.
- **Owner decision:** Preserve kebab-case files in `src/components/games/`, rules
  in `src/lib/games/` and tests in `tests/games/`, using existing Vitest setup/utilities.
- **Reason/tradeoff:** Match actual repository discovery/import/test conventions;
  tests are less physically adjacent. New tests use `tests/games/words/*.test.ts`;
  retain `tests/world-rules.test.ts` without duplicating or relocating its history.
- **Validation:** Vitest discovers new tests; run focused feature tests and final
  web coverage; inspect imports and naming in complete-feature review.
- **Exit:** Acceptance of this feature or a separately authorized convention migration.
  Handoff records whether any new departure remains necessary.

## UG-02: Next.js composition instead of App.tsx

- **Rule:** [React/TypeScript Organization](profiles/react-typescript.md):
  “App MUST remain the application composition layer.”
- **Owner decision:** Next.js pages compose the game, following current route files.
- **Reason/tradeoff:** App Router is the established composition/auth boundary;
  creating App.tsx would introduce a competing entry point. Preserve server access
  checks and thin client composition; UI remains under components/games.
- **Validation:** Page auth/subscription/prop tests and integrated route check.
- **Exit:** Feature acceptance; no framework migration authorized. Reassess in handoff.

## UG-03: Reuse existing word-domain type exports

- **Rule:** [React/TypeScript Types](profiles/react-typescript.md): shared domain
  contracts MUST live in a feature `.types.ts` file and not service implementations.
- **Owner decision:** Reuse existing filenames and `word-rules.ts`; retain its exported
  rule-result/status types in that pure module rather than moving existing contracts.
- **Reason/tradeoff:** Avoid unrelated contract/import refactoring for a bounded
  feature. This is a pure rules module, not an API/service implementation.
- **Validation:** Type checking and public rule-contract regression assertions.
- **Exit:** Feature acceptance or separately authorized type extraction; reassess in handoff.

No exception authorizes accessibility, test-threshold, authentication, subscription,
validation or API-simplicity regressions. Tailwind's configured-formatter requirement
has no formatter configured here; follow current style without inventing a new tool.
