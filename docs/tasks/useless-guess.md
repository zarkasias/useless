# Task: Useless Guess gameplay

- **Task ID:** UG-01; one complete feature, no implementation subtask/review gates.
- **Status:** Gameplay, shared result overlay and recording/statistics extension
  implemented; ready for review. Current validation and limitations are in
  [the final handoff](useless-guess-handoff.md). The earlier review does not cover
  the subsequent recording/statistics extension.
- **Profile:** [Useless Achievements Web](../project-profile.md), including actual
  commands and [narrow exceptions](../engineering-exceptions.md).
- **Source baseline:** `61d42cdee8b39f2cfa79c266ef399033e3af7eb9`, `feat/ai-workflow`.
  This is the inspected source baseline, not a claim of owner release acceptance.
- **Mode/outcome:** Feature: authenticated subscribed players can play a local
  five-letter, six-guess round within the existing games application.

## Accepted decisions

Owner decision in this chat, 2026-10-28:

- Accept the proposed UI/component structure, subject to matching the existing
  application's design and game interactions. The design acceptance criteria below
  remain mandatory; acceptance of structure is not visual verification.
- Select answers randomly and locally at round start/restart. Exclude the immediately
  previous answer when multiple answers exist; with one answer, reuse it. Choose
  uniformly from the eligible pool without an unbounded reroll loop. No answer
  changes during a round; previous-answer memory lasts only in the mounted game.
- Show real Played, Wins and Losses through the existing GameScreen. Omit
  unsupported Best score; do not invent statistics.
- Keep local round/dictionary behavior; resumable progress persistence, Guess-specific
  achievement rules, daily puzzles and leaderboards remain deferred.

Result-presentation correction, owner instruction in this chat on 2026-10-28:
use the existing `GameResultOverlay` in the same completion pattern as other games.
This supersedes only the earlier inline-result treatment; gameplay and exclusions
remain unchanged. No new dismissal behavior or overlay component is requested.

Recording/statistics extension, owner instruction in this chat on 2026-10-28:
this explicitly supersedes earlier exclusions of game-session recording, lifetime
statistics and statistics refresh. Use the existing `guess` database enum value
and game_sessions/user_game_stats flow. Use Memory's loading/prop/GameScreen/router
refresh pattern; retain the accepted shared result overlay. Add no Guess-specific
achievement rules. No commit, push, merge or deploy is authorized.

## Scope and preserved behavior

In scope: physical/on-screen keyboards, repeated-letter scoring and keyboard feedback,
invalid guesses, win/loss and restart. Wire the existing Useless Guess cabinet card
and a `/games/guess` page using established route/client/auth/subscription conventions.
Preserve all other games and current service contracts. No achievement-count gate.

Include validated win/loss recording, explicit-restart abandonment using existing
game conventions, and real Played/Wins/Losses. Exclude new Guess award rules, daily
scheduling, leaderboards, resumable round persistence, external word services,
auth/subscription redesign and dependencies. Reload still starts a new local round;
completed-session statistics persist through the existing database. No preview app.

## Current system and proposed boundaries

The existing pure `src/lib/games/words/word-rules.ts` already owns submission errors,
normalization, five letters/six guesses, exact-first repeated scoring, terminal
status and best-so-far keyboard feedback. Reuse these functions/types. Existing
`tests/world-rules.test.ts` covers repeated letters, immutability, unknown/duplicate
words, sixth-turn win/loss, post-game rejection and keyboard non-downgrade.

Accepted component boundaries (relative to `apps/web/`, follow existing kebab-case conventions):

- `src/app/games/guess/page.tsx`: server access checks and composition data only;
  preserve profile/login-return URL and entitlement patterns; load Guess statistics
  through `getAuthenticatedGameStats("guess")` as existing game pages do.
- `src/app/games/guess/guess-client.tsx`: Navbar, page width/padding and GameScreen
  composition, passing profile/entitlement/statistics props. Refresh via
  `router.refresh()` after `onGameRecorded`, matching Memory.
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
- `GameScreen`: remove Guess's temporary stats-hiding prop; pass stored games_played,
  wins and losses. Add optional losses and `showBestScore` controls in this existing
  component while preserving every other game's default columns. No separate header.
- `src/app/actions/game-actions.ts`: `recordGuessGameResultAction` validates result,
  approved answer, accepted guess sequence and PostgreSQL-compatible duration using
  existing word rules. Store guesses used as moves/metadata; omit score/mistakes.
  Reuse `RecordGameResultResponse` and `recordAuthenticatedGameSession`.
- `src/lib/types/games.ts`: add `guess` to canonical GameType and define the Guess
  result input alongside existing session/stat contracts. Existing generic stats and
  achievement services consume this union; do not introduce parallel service layers.

The shared recording flow may evaluate already-published `game_session`/`game_stat`
achievements targeting `all` or `guess`; preserve/report that behavior without
creating Guess rules or award UI. A failure after the RPC may leave a stored session,
so do not automatically retry a result. Resuming local rounds remains out of scope.

## Accepted dictionary

### Existing lists and provenance

Inspected application/shared-package filenames and word-list/dictionary references.
No production word list, source attribution or dictionary licence was found.
`src/lib/games/words/word-rules.ts` accepts a caller-supplied dictionary and does
not contain one. `tests/world-rules.test.ts` has nine uppercase fixture words;
no upstream source/licence is stated for that fixture. Retain it as regression
coverage rather than presenting it as a production vocabulary or licensed corpus.

### Accepted source, licence and exact counts

Use **SCOWL 2020.12.07**, by Kevin Atkinson and contributors, pinned to the official
[release archive](https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz).
The release is available from the [upstream release directory](https://sourceforge.net/projects/wordlist/files/SCOWL/2020.12.07/);
upstream's [tagged repository](https://github.com/en-wl/wordlist/tree/rel-2020.12.07)
describes its combined licence as MIT-like. This is a stable pinned source, not a
claim that the older release is the newest upstream database.

- **Accepted guesses: 5,063 unique words.** US English: combine only
  `final/english-words.N` and `final/american-words.N` at levels
  `N = 10, 20, 35, 40, 50, 55, 60` (14 files). Read the release's Latin-1 text;
  retain only original lowercase ASCII lines matching `^[a-z]{5}$`, deduplicate,
  sort and uppercase for the existing rules. Do not lowercase first: that would
  admit excluded capitalized entries. Do not strip accents, punctuation or suffixes.
  Exclude proper-name, upper, abbreviation, contraction, special and variant files.
- **Answers: 823 unique familiar words**, explicitly enumerated in the
  [proposed answer subset](#approved-answer-subset) below. This is a manual
  familiarity selection from the 1,365 five-letter words produced by the same
  procedure at levels 10/20, not a claim that every SCOWL word is common. All 823
  answers are present in the proposed accepted-guess set. The broader set admits
  less familiar words and inflections without selecting them as answers.
- Counts were measured against the downloaded official archive on 2026-10-28,
  not estimated. Archive SHA-256:
  `5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`.
  The release README identifies version 2020.12.07 / source checkpoint `5ef55f9`.
  During recommendation preparation the archive/candidates were inspected in
  temporary storage only; implementation delivery and validation are recorded
  once in the final handoff.

**Redistribution verified:** the release's `Copyright` file expressly permits use,
copying, modification, distribution and sale, including generated output, with
retained notices. It is a composite set of permissions, not simply an SPDX-MIT
licence: the file also contains component terms including WordNet, VarCon and
Ispell. The [versioned upstream Copyright](https://raw.githubusercontent.com/en-wl/wordlist/rel-2020.12.07/scowl/Copyright)
provides the relevant permission/attribution requirements; the downloaded release's
full 11,758-byte notice was inspected as well.

Required when implementing/distributing this recommendation:

1. Retain the release's entire `Copyright` file verbatim, including component
   notices/disclaimers; do not replace it with a short MIT label. Ship it with the
   app, proposed at `apps/web/public/licenses/scowl-2020.12.07.txt`, and retain
   copyright/source attribution beside generated dictionary data.
2. In accompanying third-party documentation, identify SCOWL 2020.12.07, Kevin
   Atkinson and contributors, the source/archive and the full notice. Clearly mark
   modifications: US-English file/level selection, ASCII five-letter filtering,
   deduplication, uppercase conversion and manually curated answer subset. Preserve
   the upstream component/non-endorsement terms; do not imply author endorsement.
3. Provide a small accessible “Word list credits” link from the game to the shipped
   notice, fitting existing app link styling. Ensure the notice remains available
   in the deployed distribution and any copied dictionary source. This adds no
   attribution banner, new theme, backend or external runtime request.

The implementation may bundle the resulting data in the existing proposed
`src/lib/games/words/word-list.ts`, with no runtime dictionary API. Keep answer and
accepted-guess roles explicit, normalize with `createWordDictionary`, verify every
answer is accepted and reject an empty/invalid pool. Tests should assert these
invariants and agreed counts, plus representative common and less-common guesses;
word membership is data, not a reason to duplicate scoring rules.

**Dictionary approval:** Owner accepted SCOWL 2020.12.07, the 823 answers and
5,063 accepted guesses in this chat on 2026-10-28 and authorized implementation,
full notices/attribution, focused tests, one final gate and one complete-feature
review. No commit, push or merge is authorized. The local
random/no-immediate-repeat policy and UI structure are already accepted; do not
reopen those decisions. Client-bundled answers are inspectable, consistent with
this local, no-stakes scope; no external word service or hidden-answer system.

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
   retain the completed board behind the shared overlay and offer Play again. Record
   each completed round once through the existing server action/RPC, refresh GameScreen
   stats only on success, and preserve gameplay/overlay on save failure.
6. Restart during play or after a result resets draft, guesses, feedback, keyboard
   and result state, selects according to the approved answer policy and restores
   focus to the game input target. Listener cleanup prevents duplicate/stale input
   after restart/navigation. No event listener blocks navigation or app controls.
7. Deduplicate recording across rerenders, callback identity changes, overlay events
   and Play again. Ignore older save feedback after a new round, while allowing a
   successful old save to refresh lifetime stats. Show Saving/success/error feedback;
   do not automatically retry ambiguous failures. Record started unfinished rounds
   as abandoned on explicit Restart (first letter starts a round); never record a
   fresh untouched round or infer losses from abandoned counts. Navigation/unmount
   does not add recording, consistent with the inspected existing games.
8. Load/pass/display/refresh statistics using Memory's pattern. Display stored games
   played, wins and losses; no unsupported score/Best values or derived losses.
   Preserve other GameScreen consumers and auth/access behavior. Server result
   validation must reject malformed/contradictory inputs before writing.
9. Board, keyboard, feedback and shared results match the existing application;
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
Results: reuse `GameResult` inside the existing `GameResultOverlay`, with the
shared default backdrop and Spider's scroll-bounded mobile content wrapper. Preserve
win/loss copy, answer reveal, guesses used and Play again. Keep the completed board
mounted behind the overlay and input locked. The shared completion overlay has no
Escape/backdrop dismissal or focus trap; do not invent one. Focus Play again on
completion; restarting clears the overlay and restores game input focus. Do not add
Guess-specific awards or score history. Show actual lifetime Played/Wins/Losses
in GameScreen, and omit unsupported Best score.

Verify alongside an existing Memory/Spider screen in the same app/theme: desktop
1280x800, mobile 390x844, narrow 320px and 200% zoom; both supported theme modes.
Inspect initial/partial board, repeated-letter row, invalid input, win/loss, long
feedback, focus and keyboard wrapping. Check text/control/focus contrast against
actual felt/result backdrops (normal text >=4.5:1, large text/control boundaries
>=3:1), reduced motion if existing animations are reused, and no horizontal scrolling.
Do not claim compliance from color names or token inspection. Use workflow evidence
attempt limits and record remaining gaps; no preview app, new fonts or assets.

## Validation and execution sequence

1. Obtain dictionary recommendation approval and implementation authorization.
   Keep the accepted UI and selection decisions above. Establish the current rules
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
   boundaries, not the rules under test. Mock the authorized recording action and
   assert correct win/loss/abandoned calls, deduplication, failure/late-response
   behavior and successful stats refresh. Keep localStorage progress writes absent.
3. Test dictionary/answer validity and selection edge cases (one answer, repeat
   avoidance). Update `tests/games/games-client.test.ts` for Guess navigation
   and `tests/games/game-screen.test.ts` for real counters and unsupported Best
   omission without changing other games' defaults. Test the result action, shared
   RPC contract and existing automatic achievement evaluation for Guess.
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
   Present the recording/statistics extension ready for review; the initial feature
   review is historical and does not approve this later scope. Reuse source-bound evidence. Fix deltas use workflow's focused
   re-review rather than a release restart. Owner accepts remaining limits.

**Next action:** Owner reviews the implementation and documented verification limits
in [the final handoff](useless-guess-handoff.md). Do not commit, push or merge.

## Approved answer subset

The following 823 lowercase entries are the exact owner-approved answer subset;
production data applies the normalization described above. Apply uppercase normalization when implementing the existing
rules contract. Membership was checked against both the common candidates and
all 5,063 accepted guesses; there are no duplicate or malformed entries.

```text
about above acorn actor adapt admit adopt after again agent agree ahead alarm album
alert alien alive allow alone along aloud amber angel anger angle angry apple apply
arena argue arise array arrow aside asset atlas audio avoid awake award aware awful
badge basic batch beach beans beard beast began begin being below bench birds birth
black blade blame blank blast blind blink block blood board boats bonus boost boots
bored bound brain brake brand brass brave bread break breed brick brief bring broad
broke brown brush build built bunch burst buyer cable cakes cards carry catch cause
cells chain chair chalk chaos charm chart chase cheap cheat check cheek cheer chess
chest chief child chips choir chord chose chunk cider civil claim clash class clean
clear click cliff climb clock clone close cloth cloud coach coast coins color comic
comma cough could count court cover craft crash crawl cream creep cried crisp cross
crowd crown crush curly curry curve cycle daily dance delay dense depth diary digit
diner dirty ditch dodge doing doors doubt dozen draft drain drama drank drawn dream
dress dried drift drill drink drive drops drove drums dusty eager eagle early earth
eaten eight empty enemy enjoy enter entry equal error essay event every exact exist
extra faced facts faint fairy faith false fancy fatal fault favor fears fence fetch
fever fewer field fifth fifty fight films final finds first fixed flame flash fleet
flesh flies float flood floor flour flown flows fluid flute focus force forms forth
forty forum found frame fresh fried front frown froze fruit fully funny furry fuzzy
games gates gears ghost giant gifts given glass glory glove gnome goals going grace
grade grain grand grant graph grasp grass grave great green grief grind groan group
grown guard guess guest guide habit hairy handy happy harsh hasty heard heart heavy
heels hello hence hobby honey horse hotel hours house human humor hurry ideal image
imply index inner input irony issue jeans jelly joint jolly judge juice knife knock
known label large laser later laugh layer learn least leave legal lemon level light
limit liver local lodge logic loose lover lower loyal lucky lunch magic major maker
march marry match maybe mayor meals meant media mercy merge merit merry messy metal
meter might mimic minor model money month moral motor motto mount mouse mouth movie
music naive nerve never newer night noble noise noisy north novel nurse occur ocean
offer often onion opera orbit order organ other ought outer owner ozone paint pairs
panel panic pants paper party paste patch paths pause peace pedal penny phase phone
photo piano piece pilot pinch pitch pizza place plain plane plant plate point polar
pound power press price pride prime print prior prize proof prose proud prove pulse
punch pupil queen query quest queue quick quiet quite quota quote radar radio rains
raise range rapid ratio razor reach react ready realm refer reign relax relay renew
reply reset rhyme right rigid rings risen rival river roads robot rocks roots rough
round route royal ruler rules rumor rural rusty sadly safer saint sales sauce saved
scale scare scarf scene scope score scrap seals seats sense serve seven shade shake
shaky shall shame shape share sharp sheep sheer sheet shelf shell shift shine shiny
ships shirt shock shoes shone shook shoot shops short shout shove shown sides sight
signs silly since sixth sixty skill skirt skull slang slash sleep slept slice slide
slope small smart smash smell smile smoke snack snail sneak sniff sober socks solar
solid solve songs sorry souls sound south space spare speak speed spell spend spent
spill spite split spoil spoke sport spots spray squad stack staff stage stair stake
stale stall stamp stand stare stark stars start state steal steam steel steep steer
stick stiff still stock stole stone stood store storm story straw stray strip stuck
study stuff stunt style sugar suite sunny super swamp swear sweat sweep sweet swept
swing sword sworn table tails taken tales talks tanks taste taxes teach teams tears
teeth tempt tense tenth terms thank theft their theme there these thick thief thing
think third those three threw throw thumb tiger tight tiles timer times tired title
toast today token tones tools tooth topic total touch tough tower towns trace track
trade trail train traps trash tread treat trees trend trial tribe trick tried trips
troop truck truly trunk trust truth tubes tutor twice twins twist uncle under union
unite units unity until upper upset urban usage usual utter vague valid value valve
venue verse video views vinyl virus visit vital vocal voice voter vowel wages waits
walks walls wants waste watch water waves weary weeks weigh weird whale wheel where
which while white whole whose wider width winds wines wings wiser witch witty wives
woman women woods words works world worms worry worse worst worth would wound wrath
wreck wrist write wrong wrote yards years yield young yours youth
```
