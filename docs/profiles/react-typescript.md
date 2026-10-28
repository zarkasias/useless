# React and TypeScript Profile

Applies only when selected in the project profile. Extends the
[core standards](../engineering-standards.md).

## Organization

- **Component types:** MUST use TypeScript and explicit props types.
- **Component names:** MUST use PascalCase.
- **Feature location:** MUST follow the project profile's feature root.
- **Component folders:** Independently maintained components MUST have a
  PascalCase folder containing source and associated tests.
- **App composition:** App MUST remain the application composition layer;
  App.tsx MAY remain at the source root.
- **Private helpers:** Small rendering helpers MAY remain with their owner.
- **Feature testing:** Do not add dependency-injection props to App solely to
  test a nested feature; test the feature at its boundary.

## Components and Hooks

- **Component rendering:** SHOULD express UI structure and connect interactions
  to named handlers.
- **Multi-step forms:** MUST give each step a named component.
- **State transitions:** Substantial transitions and asynchronous orchestration
  SHOULD live in a feature-specific hook.
- **Hook interfaces:** MUST be focused and clear; do not move component
  complexity unchanged into a hook.
- **Pure logic:** Validation and payload transformations MUST live outside
  rendering components.
- **Major UI states:** Avoid nested ternaries; use explicit branches or components.
- **Form abstractions:** Do not create a generic form framework for one feature.
- **State ownership:** Follow core standards; place React state in the closest
  common component that needs it.
- **Hook names:** MUST use the `use` prefix.

## Types

- **Domain contracts:** MUST live in a feature-specific `.types.ts` file.
- **Contract imports:** Components MUST NOT import shared domain contracts from
  service implementations.
- **Props types:** Short component-specific types MAY remain beside the component.
- **Global types:** Avoid a project-wide miscellaneous types file.

## Tests

- **Component tests:** MUST live inside the component folder beside its source.
- **Logic tests:** MUST live beside the module they exercise.
- **Test filenames:** MUST use `.test.ts` or `.test.tsx`.
- **Feature behavior:** MUST be tested directly at the feature boundary.
- **Test helpers:** Feature-specific helpers SHOULD stay in the feature;
  application-wide setup and cross-feature helpers MUST live in `src/test/`.
- **Presentational children:** Integration coverage may exercise them; do not
  create a test file for every component solely to mirror the file structure.

## Web Accessibility

- **HTML controls:** Prefer semantic HTML and native controls.
- **Form labels:** MUST be accessible.
- **Validation errors:** MUST identify the problem and be programmatically
  associated with the relevant control.
- **Responsive content:** Layouts MUST handle long content and narrow viewports.
