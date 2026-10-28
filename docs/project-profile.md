# Project Profile: Useless Achievements Web

## Scope and selected standards

- **Application:** Existing pnpm monorepo; web root `apps/web/`, package
  `@useless/web`. Mobile application and shared token package remain outside gameplay
  implementation scope. [Task: Useless Guess](tasks/useless-guess.md) owns feature
  readiness, decisions and acceptance; no second shared plan is needed.
- **Standards:** [Core](engineering-standards.md), [workflow](workflow.md),
  [React/TypeScript](profiles/react-typescript.md), [Tailwind](profiles/tailwind.md).
  Read only [the named exception record](engineering-exceptions.md); do not search
  for or create blanket exceptions.
- **Runtime/tooling:** `apps/web/package.json` requires Node 22.x; root declares
  pnpm 9.15.9. Next 15 App Router, React 19, strict TypeScript, Tailwind 4,
  Next ESLint configuration, Vitest 5, jsdom, React DOM test utilities.
  Versions here describe manifests, not new compatibility/support claims.
- **Dependencies:** Reuse current lockfile and packages. No installation or new
  dependency authorized by this task preparation. No imported Gather tooling,
  JSON Server, npm scripts, formatters or numeric performance budgets.

## Existing organization and ownership

- Next.js server `page.tsx` and thin route client files compose games. UI belongs
  in `src/components/games/`; pure rules in `src/lib/games/`; tests in `tests/games/`.
  Use established kebab-case filenames, PascalCase component exports, `@/` imports
  and existing colocated domain types, rather than a forced folder/type migration.
- Reuse `src/lib/games/words/word-rules.ts`: normalization, dictionary validation,
  exact-first repeated-letter scoring, submission rejection, win/loss and keyboard
  priority already exist. Current coverage is `tests/world-rules.test.ts` (existing
  filename, not a new suite to duplicate). At planning, no production word list or
  Guess route existed; the accepted task now defines that extension.
- New gameplay owns one round locally: answer, accepted guesses, draft and feedback.
  Derive evaluations, terminal status and keyboard statuses with existing rules.
  Do not add global state, mirrored derived state or a parallel service layer.
  The authorized recording extension uses existing server actions/RPC; local round
  resume persistence is still excluded.
- Follow the recent Spider page pattern for authenticated profile loading, then
  existing entitlement service; missing profile redirects to `/login?next=/games/guess`,
  unsubscribed user to `/games`. Do not change existing routes' differing policies.
  Preserve `Navbar` profile/subscription props and existing access/navigation patterns.
  Load Guess statistics through the existing game service and refresh on successful
  recording using Memory's route/client/GameScreen pattern. Do not fetch achievements
  or invent unsupported scores; new Guess-specific award rules remain deferred.
- **API simplicity:** Preserve established server service boundaries for auth and
  subscriptions. No new gameplay API is needed for the proposed bundled dictionary.
  For a later authorized single request, keep the request and lifecycle together;
  extract only for actual reuse/independent complexity. No generic client, redundant
  flags, unused error categories, caching or automatic retry without a named need.

## Design references and constraints

Inspect existing routes and shared components, not a separate preview app:
`src/app/games/games-client.tsx`, `src/app/games/memory/memory-client.tsx`,
`src/components/games/game-screen.tsx`, `system/game-table.tsx`, `system/game-button.tsx`,
`system/game-result.tsx`, `game-metric.tsx` and `game-card-themes.ts` (words theme).
Global semantic tokens/theme live in `src/app/globals.css`; the root layout currently
loads Inter and a violet/blue page gradient. `packages/design-tokens/tokens.json`
owns shared brand/rarity/achievement-card tokens; its Fredoka/Nunito card metadata
is not authority to change the game's active font.

The task's UI acceptance section owns the bounded board/keyboard/result adaptation.
Reuse current frame, felt/amber treatments, typography and Guess icon. Do not alter
shared tokens, redesign games, add fonts/assets, or claim visual parity from DOM tests.
Existing translucent result surfaces require actual backdrop/contrast inspection.

## Actual commands and validation

Run from repository root with Node 22.x and pnpm 9.15.9 selected:

- Development: `pnpm --filter @useless/web dev` (also root `pnpm dev:web`).
- Existing rules baseline: `pnpm --filter @useless/web test tests/world-rules.test.ts`.
- Focused feature tests after creation:
  `pnpm --filter @useless/web test tests/world-rules.test.ts tests/games/words tests/games/games-client.test.ts tests/games/game-screen.test.ts`.
- Targeted lint: `pnpm --filter @useless/web exec eslint <changed-source-and-test-paths>`;
  paths are relative to `apps/web/`. Full lint: `pnpm --filter @useless/web lint`.
- Type check: `pnpm --filter @useless/web exec tsc --noEmit --incremental false`
  (actual TypeScript executable; no invented typecheck script).
- CI-equivalent tests/coverage: `pnpm --filter @useless/web test:coverage`.
  Existing Vitest thresholds: statements 70, branches 60, functions 75, lines 70.
  Preserve them; diagnose inherited failures independently of feature regressions.
- Build: `pnpm --filter @useless/web build`. Existing Next server configuration
  may require normal environment setup. Do not expose secrets, invent values or
  change auth/providers to make a build pass. Record environmental gaps honestly.
- One final feature gate: full web lint, type check, coverage suite and web build
  above, once after the complete task. No configured formatter check or bundle/asset
  budget script exists; do not import one. Root turbo commands cover more packages
  than this bounded web feature needs.

Vitest uses Node by default, `tests/**/*.test.ts`, `tests/setup.ts` and `@/` alias.
Interactive suites opt into jsdom with `// @vitest-environment jsdom`, use React
`act`, `createElement`, `createRoot`, existing local DOM helpers and cleanup.
Do not install Testing Library or add dependency-injection props to pages for tests.
Setup rejects unexpected network requests and mocks server-only/environment values.
CI `.github/workflows/tests.yml` runs web coverage; never replace required checks
with arbitrary coverage counts or silently weaken assertions/thresholds.

## Evidence boundaries

Planning source inspection established commands, not passing baselines. Actual
implementation commands/results, review and limitations are owned by the
[feature handoff](tasks/useless-guess-handoff.md).
Before touching existing rules, execute their existing regression suite and add
missing characterization cases while those rules remain unchanged. Use focused
red/green feature tests during implementation, one final gate, one complete-feature
fresh review and one source-bound final handoff. No push/merge/deploy authorized.
