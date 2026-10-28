# Development Workflow

Owns execution stages, decisions, validation, and review. Code-quality
requirements live in the [core standards](engineering-standards.md).

## Shared Operating Rules

- **Record ownership:** Follow [AGENTS.md](../AGENTS.md#authoritative-records);
  record each fact once and link it.
- **Review unit:** Name the feature/release and source baseline in the plan.
  Tasks are implementation increments, not automatic review gates.
- **Shared context:** Continue from the current plan, decisions, and evidence;
  inspect missing/changed context rather than restarting discovery.
- **Mechanical checks:** Use configured tools for enforced rules. Reviewers assess
  unenforced requirements and specific concerns; do not assume every rule is automated.

## Roles and Decisions

- **Owner:** Sets scope and accepts the result.
- **Planner:** Prepares multi-task or ambiguous work.
- **Designer:** Prepares visual direction and a preview.
- **Implementer:** Executes tasks.
- **Reviewer:** Assesses changes in a separate fresh session.
- **Direct changes:** The request may serve as the task when outcome, scope, and
  verification are clear, no architecture/design decision remains, and no
  cross-session handoff needs a file. Resolve only missing material details.
- **Role contracts:** [Planner](../prompts/planner.md),
  [designer](../prompts/designer.md), [implementer](../prompts/implementer.md),
  [reviewer](../prompts/reviewer.md).
- **Routine decisions:** Proceed with reversible choices.
- **Owner decisions:** Ask about conflicting requirements, material scope changes,
  or required-standard exceptions.
- **Architecture approval:** Required for material changes to public interfaces,
  state/data ownership, storage contracts, or cross-module architecture. Existing
  explicit approval satisfies it; routine internal changes do not reopen the gate.
- **External actions:** Do not merge, push, publish, or message others without
  authorization for the specific action. Local-only projects need no hosted PR.

## 1. Assess

- **Inputs:** Read the owner's request, selected profile, and task if available.
  A planner may begin from an idea and draft a missing profile; mark unresolved values.
- **Existing projects:** Inspect affected source, callers, tests, configuration,
  screens, modules, data sources, styles, and integrations.
- **Baseline findings:** Distinguish inherited failures from regressions.
- **Design inputs:** For UI work, collect owner references, existing design,
  theme preferences, asset needs, and delivery constraints before proposing a direction.
  Record the route in the plan; headless work needs no visual stage.
- **Material gaps:** Resolve missing information that changes the solution.

## 2. Plan

- **Task plan:** Record outcome, preserved behavior, responsibilities, ownership,
  interfaces, risks, and validation. Reuse approved plans; revise only for missing
  detail, changed assumptions, or material deviations.
- **Complete scope:** Maintain a phase checklist for whole-project work; one
  completed phase does not complete the application.
- **Planning sequence:** Draft scope, architecture, and design needs first;
  consume the designer's brief before finalizing affected task details. Write tasks
  once; revise material changes only. Use the [plan](../templates/plan.md) for
  multi-task work and [tasks](../templates/task.md) for multi-task or cross-session
  handoffs. Direct changes need no separate task/plan file.
- **Task dependencies:** Identify dependencies, preserved behavior, observable
  acceptance criteria, and validation. Do not duplicate task criteria in the
  shared plan.
- **Integration verification:** Include an integration task or explicit criteria
  in the final task.

- **Proportionate tasks:** Deliver coherent, verifiable increments without
  creating per-task approval or review gates unless a named risk requires them.

### Readiness

- **Draft:** Discovery, requirements, or breakdown remain incomplete.
- **Blocked:** A named decision or prerequisite prevents execution.
- **Ready:** Scope and validation are actionable, required decisions are resolved,
  and prerequisites are accepted or explicitly authorized with recorded limitations.
  A new-project setup task may establish tools or baselines needed later.
- **New applications:** Owner approval is required for scope and architecture.
  A proposal is not approval.

### Design Stage

- **Design timing:** Use Assess inputs alongside scope and architecture; establish
  the brief before finalizing affected task details. For small work, the planner
  may prepare the brief in the same session; a separate role/session is not a gate.
- **Technical choices:** Consider asset availability, styling, accessibility,
  and performance early. Use imagery when it supports users and purpose.
- **Design routing:** New UI apps, intentional redesigns, and UI work without an
  established visual specification use the designer. Small additions reuse the
  existing design; refactors preserve it; headless apps need none. Record the route.
- **Design brief:** The [brief](../templates/design-brief.md) owns the visual
  specification: direction, layout, concrete tokens, component states, assets,
  and how each material requirement will be verified. Favor verifiable treatments;
  flag backdrop-dependent contrast or other costly evidence needs before approval.
- **Asset budgets:** List asset sources, formats, delivery sizes, and proposed
  ceilings; record approved numeric limits in the profile. Do not treat a JS/CSS
  ceiling as an image/font budget or infer size approval from visual approval.
- **Viewable preview:** Provide one considered key-screen direction with realistic
  content and viewing steps. Use a static mockup, isolated prototype, or explicitly
  owner-authorized first application screen. Prefer reusable work over throwaway
  coded apps. Prose/inaccessible source alone is insufficient; production edits
  and dependency installation still require authorization.
- **Owner approval:** Record the accepted brief and identifiable preview once in
  the brief before remaining affected UI implementation. Screen-prototype authorization
  is not design approval; silence is not approval. Material departures require
  renewed approval. Per-file hashes/manifests are unnecessary unless specifically required.
- **Independent work:** Setup, domain, and storage work may proceed when independent
  of the design decision; express dependencies rather than blocking unrelated work.

### Execution Modes

| Mode                     | Evidence                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New application          | Agree first-release scope, architecture, dependencies, and task order; apply design routing.                                                                             |
| Feature or bug fix       | Write a focused behavior test, confirm it fails for missing behavior, implement, pass, and refactor.                                                                     |
| Refactor                 | Establish passing characterization coverage before extraction and retain it afterward; diagnose failed assumptions, environment issues, and existing defects separately. |
| Styling migration        | Agree states, browsers/viewports, tolerances, and comparison method; record baseline and interaction coverage; allow no unapproved differences in scope.                 |
| Documentation or tooling | Use proportionate reference, configuration, and command checks; do not invent UI tests for prose.                                                                        |

- **Invalid red tests:** Syntax, import, and setup failures do not establish TDD evidence.
- **Alternative validation:** Record the method and reason when behavior tests
  are inappropriate.
- **Stale plans:** Check the plan against current source; update affected tasks
  and raise material changes. Plans are not test results, completed work, or reviews.
- **Reviewable phases:** Separate architecture extraction, content replacement,
  and styling migration when combined.

## 3. Implement and Clean Up

- **Implementation scope:** Make small coherent changes, run focused checks,
  and preserve unrelated behavior.
- **Approved design:** Implement it alongside functional and engineering
  requirements; do not silently substitute a new direction.
- **Repair limit:** After two unsuccessful code repairs of the same failure,
  pause that repair, report diagnosis/options, and continue independent work.
  Evidence collection has its own attempt limit below.
- **Cleanup:** Update callers; remove superseded implementations, unused imports,
  dead code, unnecessary temporary exports, and commented-out duplicates.
- **Compatibility and assets:** Check usage before deleting styles/assets;
  explain retained compatibility layers and reassess exception exit conditions.

## 4. Validate

- **Focused tests:** During implementation, test changed behavior. For TDD,
  confirm the initial test fails for the intended missing behavior.
- **Final gate:** Run applicable formatting, lint, type, test, build, and agreed
  performance checks once after implementing the review unit. Earlier full gates
  require a named risk, explicit task requirement, or owner request—not merely
  completion of a small increment.
- **Evidence identity:** Record command, result, environment, and commit or identified
  working-tree state once. Account for later code/config changes; a documentation-only
  commit does not invalidate unchanged application checks.
- **Repeat checks:** Rerun affected checks after fixes/changes. Repeat the full gate
  only when broad changes or a specific concern invalidate earlier evidence.
- **UI comparison:** Inspect agreed states, keyboard behavior, and layouts against
  the accepted design or existing reference.
- **Evidence attempts:** One initial browser/tool attempt plus one retry per issue;
  then record it unverified and continue safe work. Do not evade the cap with new
  capture tools, harnesses, or reviewer sessions. Respect denied access and waivers;
  reopening requires explicit owner instruction.
- **Verification limits:** Do not claim visual parity from unit tests or missing
  evidence. Gaps block only dependent work that cannot safely proceed.
- **Results:** Record commands and results concisely as passed, failed, not run,
  or not applicable, with relevant reasons.

## 5. Handoff and Independent Review

- **Final handoff:** One record containing changes, source identity, gate reference,
  gaps/exceptions, and design comparison reference. Link it from plan/PR, not every task.
- **Review cadence:** One fresh independent review per feature/release. Earlier
  review requires a named risk or explicit owner/task requirement.
- **Evidence reuse:** Accept source-bound gate results as execution evidence when
  command, environment, and source match. Independently inspect code/tests; rerun
  only disputed checks or checks affected by changed code. Independence does not
  require repeating verified mechanical work.
- **Evidence gaps:** Preserve honest verdicts, including INSUFFICIENT_EVIDENCE.
  Declared gaps may affect final confidence; owner-accepted gaps must not trigger
  another automatic evidence/review loop.

## 6. Resolve and Accept

- **Fix review:** Address blockers and rerun affected checks. One focused re-review
  covers the fix delta, named blockers, and relevant integration—not a full restart.
  After that cycle, escalate unresolved blockers or newly discovered material risks
  to the owner; never infer acceptance.
- **Owner acceptance:** The owner decides remaining limitations. Acceptance does
  not turn an unperformed check into a pass.
- **Local or remote:** Keep one local handoff or link it from a PR. Neither route
  authorizes merge or publication.

## Cost Controls

- **Deterministic checks:** Use ordinary tools.
- **Context selection:** Supply relevant context; retrieve additional files as needed.
- **Successful output:** Keep concise.
- **Failures:** Show the failing test and actionable error; retain full logs locally
  when useful.
- **Evidence records:** Record once and reference rather than copying logs and history.
- **Trial usage:** Record per-role tokens/cost and elapsed time once in the final
  handoff when tools expose them; mark unavailable values explicitly. Do not add
  instrumentation or invent attribution solely to fill the record.
