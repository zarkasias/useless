# Task: Useless Guess gameplay

- **Task ID:** UG-01; one complete feature, no implementation subtask/review gates.
- **Status:** Blocked for dictionary/answer-selection owner decision and acceptance
  of the bounded UI/structure proposal below. Planning preparation is authorized;
  gameplay implementation is not authorized by this document.
- **Profile:** [Useless Achievements Web](../project-profile.md), including actual
  commands and [narrow exceptions](../engineering-exceptions.md).
- **Source baseline:** `61d42cdee8b39f2cfa79c266ef399033e3af7eb9`, `feat/ai-workflow`.
  This is the inspected source baseline, not a claim of owner release acceptance.
- **Mode/outcome:** Feature: authenticated subscribed players can play a local
  five-letter, six-guess round within the existing games application.

## Scope and preserved behavior

In scope: physical/on-screen keyboards, repeated-letter scoring and keyboard feedback,
invalid guesses, win/loss and restart. Wire the existing Useless Guess cabinet card
and a `/games/guess` page using established route/client/auth/subscription conventions.
Preserve all other games and current service contracts. No achievement-count gate.

Exclude result recording, awards, stats queries/writes, daily scheduling, leaderboards,
new persistence, external word services, auth/subscription redesign and dependencies.
Rounds are ephemeral; reload starts a round. No separate preview application.

## Current system and proposed boundaries

The existing pure `src/lib/games/words/word-rules.ts` already owns submission errors,
normalization, five letters/six guesses, exact-first repeated scoring, terminal
status and best-so-far keyboard feedback. Reuse these functions/types. Existing
`tests/world-rules.test.ts` covers repeated letters, immutability, unknown/duplicate
words, sixth-turn win/loss, post-game rejection and keyboard non-downgrade.

Proposed paths (relative to `apps/web/`, follow existing kebab-case conventions):

- `src/app/games/guess/page.tsx`: server access checks and composition data only;
  use Spider's profile/login-return URL and entitlement patterns, without stats.
- `src/app/games/guess/guess-client.tsx`: Navbar, page width/padding and GameScreen
  composition, passing existing profile/entitlement props.
- `src/components/games/words/word-game.tsx`: one round's state and common named
  input/submit/restart handlers; lifecycle listener setup/cleanup stays with this
  owner. A separate controller hook is unnecessary for this small local round.
- `word-board.tsx` in that folder: six rows/five tiles with readable row/cell status.
  `word-keyboard.tsx`: native QWERTY letter/Enter/Backspace buttons using the same
  handlers as physical input. Distinct rendering/accessibility responsibilities
  justify these two children; no component per tile/key, generic engine or registry.
- Reuse `word-rules.ts` for pure rules. A local `word-list.ts` in the same lib folder
  may hold the owner-approved accepted words/answer subset; this is data, not an API.
  Derive evaluations, status and keyboard priority instead of storing duplicates.
- `GameScreen`: propose one backwards-compatible `showStats` option, default true,
  false for Guess. Its current mandatory/default stats would misleadingly show a
  history the feature neither loads nor records. Test existing consumers unchanged.

Do not copy Memory's result-recording effects or achievement UI. No new service,
request library, validator wrapper, global store, cache or speculative abstraction.
Existing auth/entitlement services remain appropriate established boundaries.

## Dictionary and answer selection — owner decision required

Recommended: bundle a provenance/licence-documented English five-letter accepted-guess
list and a smaller familiar, appropriate answer subset. Both normalize through
`createWordDictionary`; every answer must be accepted, with no invalid/empty pool.
No approved production list was found; the nine words in the existing tests are
fixtures, not product content. Do not silently ship those fixtures as the dictionary.

Owner must choose/approve a specific source/licence and intended breadth/content
(e.g. a deliberately small curated vocabulary with an explicit UI explanation versus
an approved licensed general dictionary). Also approve the proposed local random
answer at round start/Restart, avoiding immediate repeats when multiple answers
exist. Randomness belongs at round boundaries, not render; tests control the choice
at that boundary. No daily seed, network service or server answer-hiding requirement
is proposed; client-bundled answers are inspectable. This suits the no-stakes scope.
If the owner wants externally supplied/hidden answers, revisit scope before coding.

## Acceptance criteria

1. A subscribed user can reach Guess from the existing cabinet. Missing profiles
   follow `/login?next=/games/guess`; unsubscribed users return to `/games`.
   Other game links/access and Navbar subscription behavior remain unchanged.
2. Board always represents six five-letter rows. Draft accepts A–Z case-insensitively
   up to five characters; Backspace removes one; Enter submits through `submitGuess`.
   Both input methods share the same path. Ignore modifier shortcuts/composition,
   unrelated editing fields and already-handled events; handle keyboard-repeat
   deliberately to avoid double submissions. Native Enter/Space activation of a
   focused on-screen button must not also submit through a global key listener.
3. Unknown, duplicate, too-short or invalid guesses show the existing actionable
   rule feedback without consuming an attempt, changing accepted rows or keyboard
   statuses. Preserve the draft for correction; no hidden automatic submit.
4. Scoring consumes exact matches before misplaced matches and never awards more
   copies than the answer contains. Keys aggregate priority correct > present >
   absent and never downgrade across rounds' accepted guesses. Restart clears them.
5. A correct guess wins, including attempt six; six incorrect accepted guesses lose.
   Both terminal states reject further board edits/submissions, reveal the answer,
   show the completed board and offer Play again. No backend recording, awards,
   stats refresh, storage writes or network calls on submit/end/restart.
6. Restart during play or after a result resets draft, guesses, feedback, keyboard
   and result state, selects according to the approved answer policy and restores
   focus to the game input target. Listener cleanup prevents duplicate/stale input
   after restart/navigation. No event listener blocks navigation or app controls.
7. Board, keyboard, feedback and results pass the design criteria below; functional
   tests alone cannot establish design acceptance. No unrelated visual changes.

## UI and design acceptance (existing-design adaptation)

Use existing GameScreen header/back link, Guess icon `/game_icons/guess.webp`,
Navbar and `max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8` container. Retain current Inter
application typography, bold game headings, violet/fuchsia/orange header rail and
sky/indigo words cabinet theme. The cabinet changes availability/navigation, not art.

Inside `GameTable`, reuse its emerald felt, amber rail, texture, rounded corners
and existing compactMobile option. Place attempts/Restart controls above the board,
using `GameMetric` and `GameButton` rather than a new toolbar style. Keep board
centered with a modest width (~20rem), five equal columns, square rounded-md tiles,
consistent small gaps and font-black uppercase letters; six rows remain stable
through feedback/results. Never turn the whole application into a white Wordle clone.

Use opaque neutral tile/key surfaces (`slate-800` with `slate-100` text), correct
`emerald-700` with white text, present `amber-300` with `amber-950` text, absent
`slate-700` with white text, and a visible light/amber active-row border. These
are proposed existing Tailwind palette treatments, not measured contrast evidence.
Apply the same status mapping to board and keyboard. Include a visible text legend
and accessible labels (letter, position, status); color alone must not convey scoring.

Keyboard: three centered QWERTY rows, native buttons, wider named Enter/Delete keys,
rounded controls matching the existing amber/dark game treatment, visible focus
using the shared focus/ring treatment. Keep practical targets (aim >=44px high and
>=24px wide at 320px), no overflow or shrinking labels into illegibility. Avoid
setting persistent scoring keys disabled merely because a letter is absent.

Feedback: reserve an inline readable status region near the board so invalid input
and accepted-row summaries do not move the layout. Announce submissions/results
politely, not each tile as it mounts. Use opaque text backing for reliable contrast.
Results: reuse `GameResult` inline below the board, win/loss copy and answer/attempt
metric, with Play again; no new modal or overlay focus trap. Keep the final board
visible, announce the result, move focus to its heading/Play again deliberately,
and return it to the game on restart. Do not add achievements, score history or
misleading default Played/Wins/Best values.

Verify alongside an existing Memory/Spider screen in the same app/theme: desktop
1280x800, mobile 390x844, narrow 320px and 200% zoom; both supported theme modes.
Inspect initial/partial board, repeated-letter row, invalid input, win/loss, long
feedback, focus and keyboard wrapping. Check text/control/focus contrast against
actual felt/result backdrops (normal text >=4.5:1, large text/control boundaries
>=3:1), reduced motion if existing animations are reused, and no horizontal scrolling.
Do not claim compliance from color names or token inspection. Use workflow evidence
attempt limits and record remaining gaps; no preview app, new fonts or assets.

## Validation and execution sequence

1. Resolve dictionary/answer/UI decisions above. Establish the current rules
   baseline with `pnpm --filter @useless/web test tests/world-rules.test.ts` before
   any rule edit. Add missing characterization under `tests/games/words/word-rules.test.ts`
   for invalid length/characters, normalization/dictionary entries, priority upgrades
   and terminal boundaries against unchanged rules. Keep existing assertions/history.
   Prefer zero changes to existing rules if they already satisfy the behavior.
2. Focused feature red/green in `tests/games/words/word-game.test.ts`, `guess-page.test.ts`
   and `guess-client.test.ts`; use existing Vitest React/DOM helpers and jsdom directive.
   Exercise physical vs on-screen equivalence, duplicate Enter prevention, invalid
   inputs/attempt counts, repeated scoring/key feedback, sixth-turn win/loss,
   terminal lockout, restart/focus and unmount listener cleanup. Control answer
   selection without adding page injection solely for tests. Mock auth/service
   boundaries, not the rules under test; assert no result/award writes occur.
3. Test dictionary/answer validity and selection edge cases (one answer, repeat
   avoidance if agreed). Update `tests/games/games-client.test.ts` for Guess navigation
   and `tests/games/game-screen.test.ts` for hidden stats without changing defaults.
   Keep tests behavioral; no per-presentational-component quota or new test framework.
4. Run focused tests/targeted lint/type checks during implementation using the
   [profile's actual commands](../project-profile.md#actual-commands-and-validation).
   Perform the integrated same-app gameplay/design comparison described above;
   no need to replay unrelated Memory result-recording journeys.
5. One final gate for the complete web feature: full web lint, nonincremental tsc,
   web coverage suite (existing CI thresholds) and web build, as recorded in profile.
   No new budgets/formatter command and no full gate per component. Record inherited
   failures/environment requirements separately; do not weaken checks to pass.
6. Prepare one `docs/tasks/useless-guess-handoff.md` with implementation commit or
   identified working state, actual command/environment/results, design comparison,
   limitations and exception reassessment. Do not fabricate results in planning.
   Obtain one fresh complete-feature review from source baseline through final
   implementation; reuse source-bound evidence. Fix deltas use workflow's focused
   re-review rather than a release restart. Owner accepts remaining limits.

**Next action:** Owner resolves the dictionary/source and selection decision and
accepts the UI/structure proposal; then authorize gameplay implementation. No
installation, gameplay source changes, push, merge or deploy in this preparation.
