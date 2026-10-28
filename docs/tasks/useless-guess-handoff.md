# Useless Guess implementation handoff

## Current delivery: recording and lifetime statistics

The owner's recording/statistics instruction explicitly supersedes all earlier
no-recording/statistics exclusions below. Guess now records validated completed
and explicitly abandoned sessions, and displays real Played/Wins/Losses in the
existing GameScreen, following Memory's server-page/client/refresh pattern.
The shared result overlay correction remains intact. Guess-specific awards,
round-resume persistence, daily puzzles and leaderboards remain deferred.

The earlier complete-feature review and its PASS applied before this extension.
This current extension is implemented and validated, awaiting review; no new
independent-review verdict is claimed. The source is the existing uncommitted
working tree on execution base `d746ca70a00be75bca87cd805d340a8f2dd79d0f`.

## Source and scope

- Branch: `feat/ai-workflow`; implementation is uncommitted as requested.
- Execution base: `d746ca70a00be75bca87cd805d340a8f2dd79d0f` (checked-in planning).
  [Task](useless-guess.md) retains the original inspected application baseline.
- Source identity: that base plus the current tracked diff and new Guess files in
  `apps/web/src/app/games/guess/`, `src/components/games/words/`,
  `src/lib/games/words/word-list.ts`, both SCOWL notices, `tests/games/words/`,
  and accompanying task/third-party documentation. No commit was created.
- Approved scope/decisions remain in the task; profile owns actual commands and
  named exceptions. No dependencies, lockfiles, shared rules, authentication or
  subscription services changed. Existing `word-rules.ts` is unchanged.
- Result: gameplay implemented. The original complete-feature review passed after
  one scoped blocker fix; the subsequent owner-requested overlay correction has
  scoped validation recorded below, without a new independent-review verdict.
  Owner acceptance remains pending.

## Delivered changes

The new `/games/guess` page uses existing profile and entitlement services and
redirect patterns; its route client composes Navbar, GameScreen and WordGame.
The existing cabinet links to Guess for subscribers with a keyboard-accessible
entry. GameScreen hides unsupported lifetime stats only when `showStats={false}`;
existing game defaults remain unchanged.

One component owns answer, accepted guesses, draft and feedback; pure evaluations,
keyboard priorities and terminal status derive from existing word rules. Board
and keyboard children own their distinct rendering/accessibility responsibilities.
Physical and on-screen input share handlers; native button activation is not
hijacked, modifier/composition/repeat/editing/outside events are ignored, and the
listener cleans up. Win/loss lock input, retain the completed board, reveal the
answer and focus Play again. Restart clears round state, restores input focus and
uniformly selects a local answer excluding the immediately previous one when possible.

Bundled SCOWL 2020.12.07 contains exactly 823 approved answers and 5,063 accepted
US-English guesses. The source archive and filtering/curation criteria are documented
in [SCOWL provenance](../third-party/scowl.md). The complete original 11,758-byte
Copyright is preserved byte-for-byte beside the data and in `public/licenses/`,
linked visibly as Word list credits. No runtime word service or new package.
The original no-recording/statistics scope in this historical delivery is superseded
by the current extension above and its detailed evidence below.

## Validation

Local macOS, 2026-10-28; Node 22.15.0 and pnpm 9.15.9 selected with
`PATH=/Users/davidchambers/.nvm/versions/node/v22.15.0/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`.
Commands below ran from repository root; results bind to the uncommitted application
source described above. Documentation-only updates do not invalidate unchanged checks.

- Baseline `pnpm --filter @useless/web test tests/world-rules.test.ts`: PASS, 11 tests
  before implementation. Added boundary characterization passed against unchanged
  rules. No rule edits were needed.
- Pre-implementation regression red: shared GameScreen hidden-history and cabinet
  subscriber access tests failed for their intended missing behavior, with 32
  other assertions passing. Updated only the intentionally obsolete Coming Soon
  expectation; other game assertions remain.
- Focused `pnpm --filter @useless/web test tests/world-rules.test.ts tests/games/words tests/games/games-client.test.ts tests/games/game-screen.test.ts`:
  PASS, 8 files / 50 tests. Covers access, composition, dictionary integrity,
  letter input/cap/delete, invalid/duplicate words, repeated scoring/priorities,
  sixth-turn win/loss, lockout, restart/no-repeat/focus, native Enter handling,
  ignored events, StrictMode cleanup, and no gameplay network/storage writes.
- Focused TypeScript and changed-file ESLint: PASS before the final gate.

One final gate, with all four web checks executed once sequentially:

1. `pnpm --filter @useless/web lint`: PASS, no errors. Two inherited warnings in
   unchanged `scripts/upload-achievement-assets.mjs` (unused variables); not suppressed.
2. `pnpm --filter @useless/web exec tsc --noEmit --incremental false`: PASS.
3. `pnpm --filter @useless/web test:coverage`: PASS, 186 files / 2,064 tests.
   Statements 95.35%, branches 93.01%, functions 96.34%, lines 95.72%; existing
   thresholds retained. No extra dependency or test framework installed.
4. `pnpm --filter @useless/web build`: PASS, including the authenticated Guess route.
   Existing workspace-root/multiple-lockfile and webpack string-cache warnings
   remain informational; unrelated configuration was not changed to silence them.

Diagnostic logs, while retained: `/tmp/useless-guess-final-{lint,types,coverage,build}.log`.
No Gather tooling/budgets or invented formatter command. No numeric performance
budget or complete accessibility audit is claimed.

## Browser/design evidence and limits

The following records the initial implementation. The correction section below
supersedes inline-result presentation and its screenshots; other evidence is reused.

Verified in the existing signed-in Chrome session at `http://localhost:3000/games/guess`;
normal existing server/access checks were used without auth bypass or a preview app.
Compared the actual Memory screen's header, felt/amber rail, control and typography
treatment with Guess in the same application. No Memory game was played or recorded.

- 1280x800 desktop, 390x844 mobile and 320px narrow viewport overrides verified by
  DOM dimensions. No horizontal page overflow at 390 or 320; keyboard buttons are
  44px high, minimum 25px wide at 320. Board/keyboard/result remain in normal flow
  with vertical scrolling. Native header/footer are unchanged.
- Physical and on-screen inputs both submitted guesses. Invalid `ZZZZZ` retained
  the draft and consumed no turn. A six-wrong-guess round lost with answer CHEAT,
  completed board visible and input disabled; Play again received focus.
- A subsequent round accepted on-screen APPLE then physical SLATE/BLADE/FLAME,
  preserving repeated-letter/key feedback and winning on guess four with FLAME;
  Play again again received focus. Restart returned focus to the game.
- Screenshots: `/tmp/useless-guess-mobile-result.png` (full page, sticky-navbar
  capture artifact) and `/tmp/useless-guess-mobile-win.png` (normal mobile viewport).
  Screenshots are local evidence, not a claim of complete pixel parity.
- New tiles, key labels and feedback use opaque scored/neutral surfaces and named
  statuses/legend. Result reuses existing translucent GameResult presentation.
  Sampled computed CSS Lab text colors converted to D65/sRGB gave 5.37:1 for
  white/correct, 10.34:1 white/absent, 10.37:1 present, 13.17:1 unscored key and
  17.21:1 feedback. These sampled pairs do not constitute a full screen audit.
- 200% zoom remains UNVERIFIED: page-level zoom shortcuts did not change reported
  viewport/device ratio; the one native-app follow-up was denied Computer Use
  access. No alternate harness or further permission bypass was attempted.
- Dark-theme runtime comparison remains UNVERIFIED: current page is light, class
  dark mode exists in configuration, but no theme switch/provider is exposed in
  the inspected game shell. Source uses stable opaque gameplay surfaces; this is
  not a runtime dark-theme pass. Screen-reader output and reduced-motion system
  behavior remain unverified beyond semantic assertions/source inspection.

## Exceptions and review

UG-01/02/03 remain confined to the owner's existing kebab-case folders/separate tests,
Next.js composition and existing pure-rule type exports. No rule migration or new
exception was introduced. Reassess at owner acceptance; no blanket permanent waiver.

One fresh independent complete-feature reviewer inspected the complete tracked and
untracked delta against the execution base, including code/tests, access, data,
licensing and provenance, reusing source-bound gate results. Initial verdict:
CHANGES_REQUESTED for one P2 blocker: `hover:brightness-125` reduced correct-key
white-label contrast from ~5.37:1 to ~3.67:1 at 12/14px.

The only subsequent application fix replaced that filter with
`hover:border-amber-50`, preserving text/background colors and focus-visible rings.
Scoped verification under the same pinned runtime:

- `pnpm --filter @useless/web test tests/games/words/word-game.test.ts`: PASS, 8 tests.
- `pnpm --filter @useless/web exec eslint src/components/games/words/word-keyboard.tsx`:
  PASS, no warnings/errors.
- `pnpm --filter @useless/web build`: PASS; changed CSS utility delivery revalidated.
  Log: `/tmp/useless-guess-hover-build.log`. This was an affected build check after
  the fix, not a second full gate; unaffected type/coverage results were reused.
- Browser hover of an enabled scored key confirmed `:hover=true`, `filter=none`,
  unchanged foreground/background and the new border highlight. Correct-key
  contrast therefore retains its static ~5.37:1 on hover. Focus classes unchanged.
- Final game reset and click-to-focus behavior verified; temporary viewport override
  cleared, restoring the original 1175px-wide browser viewport. User's app tab and
  existing development server remain open; temporary Memory reference tab closed.

The same reviewer performed one focused fix re-review, confirmed the P2 resolved,
and returned **PASS, no remaining code blockers within reviewed scope**. No checks
were independently rerun or files edited by the reviewer. The browser/assistive-
technology limits above remain unverified, not waived or converted to passes.
Owner acceptance of those limits and this feature remains pending.

Final documentation/reference checks found no broken local paths, no changes to
existing word rules or dependencies/lockfiles, and no whitespace errors in the diff.
The reusable instructions remain unchanged. No commit, push, merge or deploy.
Per-role tokens/cost unavailable.

## Owner-requested result-overlay correction

The task records the owner's bounded presentation correction. Only
`src/components/games/words/word-game.tsx` and its focused test changed in application
source/test scope for this correction; the existing shared overlay and result
components are unchanged. Task/handoff documentation reflects the correction.

Inspected Memory, Klondike and Spider completion paths. Guess now conditionally
composes the same default `GameResultOverlay` around `GameResult`, directly in the
GameTable content, with Spider's existing scroll-bounded mobile wrapper. No new
modal, dismissal state, generic overlay or focus-trap system. The shared component
supports neither Escape nor backdrop dismissal for completion results; tests and
browser checks confirm that those interactions leave the overlay in place, the
completed board mounted and input locked. Play again remains the result action,
using the existing round reset/no-repeat/focus behavior. Win/loss, answer and guesses
used remain in the card. Lifetime stats stay hidden; no persistence/recording changes.

### Scoped validation

Same local Node 22.15.0/pnpm 9.15.9 environment and execution base above; uncommitted
working tree. New overlay assertions first failed in four tests for the missing
overlay, with six existing gameplay tests passing, before the presentation change.
After correction:

- `pnpm --filter @useless/web test tests/games/words tests/games/game-result.test.ts tests/games/spider/spider-gamecontent.test.ts tests/games/klondike/klondike-gamecontent.test.ts`:
  PASS, 8 files / 67 tests. Both win/loss overlays retain answer/count, keep the
  board mounted, preserve terminal lockout/focus, ignore Escape/backdrop and reset
  through Play again. Existing result/overlay consumer interactions also pass.
- `pnpm --filter @useless/web exec tsc --noEmit --incremental false`: PASS.
- `pnpm --filter @useless/web exec eslint src/components/games/words/word-game.tsx tests/games/words/word-game.test.ts`:
  PASS, no warnings/errors.
- `pnpm --filter @useless/web build`: PASS. Diagnostic log:
  `/tmp/useless-guess-overlay-build.log`. This affected build validates the new
  component import/composition; no full gate or independent review was restarted.

In the existing signed-in Chrome app, verified a six-guess loss (AVOID), answer/count,
Play again focus, centered shared result/backdrop at 1280x800 and 390x844, and no
horizontal overflow at 390 or 320px. At 390 the result card measured 290px wide and
264px high, within the viewport. At 320 the heading and action fit without page
overflow. Escape and a click on exposed backdrop did not dismiss or unlock input.
Play again removed the overlay, enabled the keyboard and focused the game. Restored
normal browser viewport afterward.

Compared with Spider's actual shared-overlay completion composition (including the
same mobile wrapper), Memory/Klondike completion composition, and their passing
consumer regression tests. Browser visual inspection exercised Guess's rendering
of that same shared overlay; no unrelated game's recorded result was generated
solely to force a live reference overlay. This is not a side-by-side live reference
result capture or a full new accessibility audit.

Corrected screenshots: `/tmp/useless-guess-overlay-desktop.png` and
`/tmp/useless-guess-overlay-mobile.png`. An initial desktop screenshot caught the
shared entry animation mid-fade; the saved desktop image was replaced with its
stable opacity-1 capture. Earlier inline-result images are superseded for presentation.
Existing zoom/dark-theme/assistive-technology evidence limits remain unchanged;
no denied/capped access was reopened. No commit, push, merge or deploy performed.

## Recording/statistics extension: implementation and evidence

### Changed contracts and functions

- `src/lib/types/games.ts`: canonical GameType now includes `guess`; existing
  GameSession/UserGameStats/RecordGameSessionInput/GameTriggerConfig inherit it.
  New `RecordGuessGameResultInput` carries result, answer, accepted guesses and
  elapsed seconds. No fabricated score or mistakes fields.
- `src/app/actions/game-actions.ts`: new `recordGuessGameResultAction` reuses the
  existing result response contract and shared recording service. It validates
  result membership, approved answer, dictionary-valid unique guesses and terminal
  consistency by replaying existing `submitGuess`/status rules. Duration must be a
  nonnegative safe integer fitting PostgreSQL integer. Unsupported metrics remain
  null through existing service defaults; moves and metadata store actual guesses
  used, with word length/max guesses metadata. Existing game actions unchanged.
- `WordGame`: one guarded recording attempt per round, Saving/saved/error feedback
  inside the existing GameResultOverlay, late-response protection tagged by round,
  and success-only `onGameRecorded`. Play again cannot re-record completion.
  Started unfinished rounds are abandoned on Restart, following Spider's behavior;
  untouched rounds and navigation/unmount do not record. Abandoned-save failures
  show Spider-style dismissible feedback while the next round remains playable.
  The round starts on first letter; elapsed seconds are measured rather than
  invented. No automatic retry of an uncertain save.
- Guess page: `getAuthenticatedGameStats("guess")` is loaded alongside entitlements
  after the existing profile guard and passed as initialStats. GuessClient uses
  `router.refresh()` on recording success, matching Memory; round state survives
  stats rerenders. Existing authentication/subscription redirects preserved.
- `GameScreen`: optional losses and showBestScore props add actual Losses and omit
  unsupported Best for Guess. Default Played/Wins/optional Win Rate/Best behavior
  for Memory, Spider and Klondike remains unchanged. No separate stats header;
  temporary showStats option removed.
- Word rules, dictionary/licences, overlay component, other game logic, packages,
  lockfiles and reusable standards are unchanged by this extension. Two concurrent
  external Klondike Tailwind class edits were observed and left untouched; they
  are not authored as part of Guess recording.

### Database/types audit and remaining requirements

No generated Supabase Database/Enums artifact, CLI configuration or type-generation
script was found in this repository. `src/lib/supabase.ts` and `src/lib/types/games.ts`
are hand-written contracts. The checked-in source has no other exhaustive GameType
mapping or runtime game-name list to expand; generic service/achievement queries
consume the canonical union. Updated that existing union/input contract rather
than inventing a generated file or new generation process.

A read-only request to the configured database's OpenAPI schema confirmed both
`game_sessions.game_type` and `user_game_stats.game_type` enumerate memory,
solitaire, spider and guess, and `record_game_result` exposes the existing
p_user_id/p_game_type/p_result and nullable metric/metadata arguments. Local ignored
SQL snapshots do not describe these game tables/functions. No schema mutation or
additional migration was performed. Live win/loss recording and updated counters
verified that the existing RPC supports Guess; **no additional database change is
required for this implementation**. Other environments must have the same existing
RPC/tables and the already-applied `guess` enum value.

The shared RPC has no idempotency-key parameter. Frontend round guards cover the
requested rerender/overlay/Play-again duplicates; no distributed exactly-once or
arbitrary request replay guarantee is claimed. An RPC commit followed by failed
session/stat loading or award evaluation can return an uncertain error. This is
existing shared-flow behavior: retain the result, do not auto-retry, and do not
announce/refresh as success. Statistics can be checked on a later normal reload.

### Existing automatic achievements

`recordAuthenticatedGameSession` still runs `evaluateGameAchievements` after the
RPC and session/stat reads. Existing published game_session/game_stat definitions
matching `game: all` or an already-present `game: guess` may automatically insert
user_achievements when eligible, skipping owned awards. Score-based conditions see
null for unsupported Guess score. No Guess-specific definitions, award rules or
award UI were created, and no generic evaluation was suppressed. The action keeps
returning existing unlockedAchievements in the established response contract.

### Checks

Local macOS, 2026-10-28, pinned Node 22.15.0/pnpm 9.15.9 and PATH stated above.
Results apply to this recording extension's uncommitted source plus the small
restart-focus correction described below; documentation-only edits followed checks.

- Focused red before implementation: nine intended failures for missing recording,
  stats loading/display/refresh, with 16 existing tests passing.
- Focused green:
  `pnpm --filter @useless/web test tests/games/words tests/games/game-screen.test.ts tests/games/game-service.test.ts tests/games/game-actions.test.ts tests/games/game-trigger.test.ts tests/games/memory/memory-client.test.ts tests/games/memory/memory-game.test.ts`
  PASS, 12 files / 192 tests. Includes win/loss/abandon recording, input validation,
  measured duration, duplicate prevention across StrictMode/rerender/Play again,
  failure and stale-response paths, existing Memory behavior, stats callbacks and
  actual stored counters, plus existing all-game achievement behavior for Guess.
- Focused type checking and affected-file ESLint: PASS. An initial React props
  inference error in the new callback test was corrected before the final gate.
- One final extension gate: `pnpm --filter @useless/web lint`,
  `pnpm --filter @useless/web exec tsc --noEmit --incremental false`,
  `pnpm --filter @useless/web test:coverage`, and `pnpm --filter @useless/web build`:
  all PASS. Coverage: 187 files / 2,111 tests; statements 95.40%, branches 93.04%,
  functions 96.37%, lines 95.76%; existing thresholds retained. Full lint has only
  the two previously documented unused-variable warnings in the unchanged asset
  script. Logs: `/tmp/useless-guess-recording-{lint,types,coverage,build}.log`.
- Mobile verification exposed retained scroll inside an overflow ancestor after
  Play again. A one-line Guess restart focus correction lets the browser restore
  the game position instead of preserving the clipped offset. Affected WordGame
  tests PASS (16), WordGame ESLint PASS, and the affected production build PASS
  after resolving the environment issue below. No second full gate run.

### Live application and environment evidence

Using the existing authenticated Chrome session and normal app route, a BASIC loss
and SPOTS win both reported Result saved. GameScreen refreshed from 0 played / 0
wins / 0 losses to 2 / 1 / 1 without resetting the completed board/overlay. Escape
and overlay interactions did not increment counters. Play again started a fresh
round without an extra session. Mobile stats used the existing GameScreen at 390
and 320px with no horizontal page overflow; no unsupported Best or Win Rate shown.

An additional live round encountered an uncertain save while Next development and
a follow-up production build both used `.next`; the affected build failed with
`Invariant: no direct app page entry found for /_not-found`, and the old dev server
then returned Internal Server Error. No uncertain result was retried. Stopped the
verified development process, reran only the affected build successfully, then
restored `pnpm --filter @useless/web dev` on port 3000. The first browser wait during
initial route compilation timed out; once compilation completed the server logged
GET /games/guess 200 and a fresh DOM snapshot confirmed the restored app with
persisted counters still 2 / 1 / 1 and a fresh round. Thus the additional attempt
was not counted. This was resolved by serializing local dev/build execution, not
changing database or unrelated build configuration.

Affected build logs: `/tmp/useless-guess-recording-focus-build.log` (environment
failure) and `/tmp/useless-guess-recording-focus-build-retry.log` (PASS with dev
stopped). Restored dev process is left running for review. Browser restart handling
showed overflow ancestor scrollTop 0 and game input focus; the completed board and
shared overlay remain as accepted. Screenshot:
`/tmp/useless-guess-statistics-mobile.png`. Original zoom/dark/assistive-technology
verification limits are not reopened or converted to passes.

No further independent review was requested for this extension; implementation is
ready for review. No commit, push, merge, deploy, schema mutation or dependency
installation. Existing live test win/loss sessions remain in the signed-in user's
statistics as recorded above.
