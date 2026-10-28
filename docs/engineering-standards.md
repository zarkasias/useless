# Core Engineering Standards

## Rule Language

- **MUST:** Required; violations block acceptance.
- **SHOULD:** Preferred; explain departures.
- **MAY:** Optional.

These language-independent standards support code that developers can
understand, debug, and extend. Apply technology profiles selected in the
[project profile](project-profile.md).

## Responsibilities and Interfaces

- **Module responsibilities:** SHOULD be clear, singular, and exposed through
  explicit interfaces.
- **Code extraction:** SHOULD address distinct responsibilities or meaningful
  reuse, not arbitrary line counts; avoid unnecessary fragmentation.
- **Existing modules:** MUST be considered before creating alternatives.
- **Entry points:** SHOULD compose features rather than contain detailed domain logic.
- **Pure domain rules:** SHOULD be separable from rendering and external effects.
- **Existing contracts:** MUST be preserved unless the task changes them;
  identify callers affected by interface changes.
- **Names and files:** SHOULD describe purpose and follow project conventions.
- **Shared code:** SHOULD serve actual reuse, not hypothetical future needs.

## State and Data

- **Mutable state:** SHOULD have one clear owner near its consumers.
- **Derived values:** SHOULD NOT be stored independently.
- **Data and presentation:** SHOULD be separated where it improves clarity.
- **New abstractions:** Require a concrete need, including state frameworks.

## API and Request Boundaries

- **Simple default:** SHOULD use the existing project client, otherwise the
  platform's built-in request mechanism, behind a short operation-named function.
  A single endpoint does not justify a generic client framework.
- **Cohesive default:** For one consumer, the request and its lifecycle SHOULD
  live together in one focused module, such as a feature hook/controller, outside
  rendering. A named request helper MAY remain private in that module.
- **Extraction threshold:** Separate API modules SHOULD serve actual reuse,
  substantial independent protocol/validation logic, or an established project
  boundary. Testability alone, possible future endpoints, and concern labels do
  not justify extra files. Retain useful existing data-state tools.
- **Failure handling:** SHOULD share one actionable failure path when recovery is
  the same. Add error categories only when callers or diagnostics use them;
  distinguish cancellation from failure.
- **Boundary validation:** MUST validate untrusted data as required for safe use.
  SHOULD validate once at entry, without duplicating checks or turning incidental
  fixture details, such as current artwork paths, into API restrictions.
- **Async correctness:** MUST prevent stale results from corrupting current state.
  SHOULD use one clear mechanism per invariant; avoid overlapping flags/guards.
  Preserve accepted user data when requests fail.
- **Added machinery:** Caching, automatic retries, pagination, normalization,
  orchestration, and request libraries SHOULD address a named current requirement.
  Share repeated transport concerns when they actually recur; endpoint count alone
  does not require a framework.
- **Existing contracts:** Simpler implementation MUST retain approved behavior;
  propose material contract changes rather than silently removing safeguards.

## Test Quality

- **Behavior coverage:** New behavior and bug fixes MUST have meaningful tests
  for relevant failure and boundary cases.
- **Test targets:** MUST be observable outcomes or public contracts, not private state.
- **Assertions:** MUST NOT be weakened to pass.
- **Mocks:** SHOULD be limited to necessary external boundaries; avoid mocking
  the behavior under test.
- **Test level:** Select unit, integration, browser, or other tests by risk.
  Coverage percentages alone do not establish quality.
- **Visual changes:** MAY use appropriate visual checks instead of unit tests.
  See the [workflow](workflow.md) for execution requirements.

## Errors and Accessibility

- **Async interfaces:** MUST handle possible loading, success, empty, and error states.
- **Errors:** MUST NOT be silently swallowed. User-facing errors SHOULD explain
  the problem and recovery without exposing secrets.
- **User interfaces:** MUST use accessible platform controls and semantics,
  support keyboard interaction where applicable, and preserve visible focus.
- **Custom interactions:** MUST preserve keyboard, focus, naming, and state
  behavior; ARIA alone is insufficient.

## Dependencies and Performance

- **Existing dependencies:** SHOULD be preferred before adding alternatives.
- **New dependencies:** MUST have a stated purpose and an assessment of relevant
  size, runtime, and maintenance impact.
- **Performance budgets:** MUST be met as agreed in the task.
- **Performance claims:** MUST state the measurement method and result.
- **Optimization:** Address measured or clearly identified problems; avoid
  speculative memoization.
- **Independent I/O:** SHOULD run concurrently where correctness and resource
  limits allow.

## Integrity and Exceptions

- **Task scope:** Keep changes within the agreed scope.
- **Checks and budgets:** MUST NOT be disabled, weakened, or lowered to pass.
- **Required-rule exceptions:** Record the rule, reason, tradeoff, owner decision,
  scope, and exit condition using the [exception template](../templates/engineering-exceptions.md).
- **Legacy conflicts:** Assess conflicting conventions; their existence does not
  authorize a blanket rewrite. Follow the [workflow](workflow.md).
