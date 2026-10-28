# Design Brief: <name>

Use with the design stage in [the workflow](../docs/workflow.md).
Replace placeholders with project-specific decisions; keep scope proportionate.

## Context and Status

- Related project profile, plan, and affected task IDs:
- Intended users, outcome, and key screen/journey:
- Scope and exclusions:
- Existing design references and constraints:
- Brief version and status (proposed / approved / superseded):
- Assumptions and unresolved owner questions:

## Visual Direction

- Chosen direction and rationale tied to the intended user/outcome:
- Hierarchy, density, tone, and distinctive visual choices:
- Accessibility considerations and constraints:

## Layout

- Key screen regions, content order, alignment, and primary action placement:
- Relevant display sizes/orientations and how layout changes between them:
- Container bounds, gutters, wrapping, overflow, and long-content behavior:
- Representative content used in the preview, including boundary cases:

## Concrete Tokens

For each token give its name, exact value/unit, and intended use. Reference
existing tokens where applicable; avoid vague values such as "large spacing."

- Colors: surfaces, text, borders, accent/actions, feedback; contrast expectations:
- Typography: font family/fallback, sizes, weights, line heights:
- Spacing and sizing: scale, containers, control dimensions, responsive thresholds:
- Borders, radii, elevation, and motion (or explicitly none/reduced-motion behavior):

## Components and States

For each affected component, record appearance and interaction in applicable states:

- Default, hover, pressed/selected, focus, and disabled:
- Loading, empty, populated, validation/error, and success:
- Keyboard behavior, focus transitions, and accessible labels/announcements:
- Content limits and layout at narrow sizes; mark inapplicable states with reasons:

## Assets

- Required images, icons, fonts, or other media; or explicitly none:
- Source/location, provenance/usage rights, dimensions/formats, alternatives, and fallbacks:
- Per-asset measured/estimated delivery bytes and proposed ceiling; approved
  numeric budgets belong in the project profile, including images/fonts:
- Existing assets reused; proposed dependencies or acquisition requiring authorization:

## Viewable Preview

- Artifact location and identifiable reference (static mockup, isolated prototype,
  or owner-authorized first application screen):
- How to open/view it, including any already-available tool requirements:
- Key screen, representative content, states, and sizes demonstrated:
- Production-screen authorization if applicable; static/mocked interaction limitations:
- Viewing verification performed and any inaccessible/unverified portions:

## Verification Methods

| Material requirement | How verified | Evidence limits / owner decision needed |
| --- | --- | --- |
| Visual direction and layout | Owner comparison with the accepted preview | |
| Accessibility and interaction | Appropriate calculations, tests, or permitted inspection | |
| Assets and delivery | Emitted size/format against approved profile limits | |

- **Task references:** Brief sections assigned to affected UI responsibilities;
  tasks link them rather than copying this specification.
- **Verification scope:** Use workflow attempt limits; visual approval alone does
  not establish accessibility, functional, or asset-budget compliance.

## Owner Approval and Handoff

- Decision: pending / approved / changes requested:
- Owner, date, and approval reference:
- Accepted brief/preview reference and affected UI scope; no per-file hashes required:
- Requested revisions or explicitly accepted limitations/deviations:
- Implementation comparison method and reference states:
- Remaining questions, task dependencies, and next action:
