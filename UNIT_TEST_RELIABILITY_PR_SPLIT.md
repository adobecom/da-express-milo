# Unit Test Reliability PR Split Handoff

Last updated: 2026-10-29

## Purpose

The `unit-tests` branch accumulated several independent reliability fixes in a small number of mixed commits. This document records the evidence, scope boundaries, branch split, dependencies, validation, and remaining work so the ticket can ship as focused PRs without losing context.

The original branch is intentionally retained as the integration/reference branch. Do not cherry-pick its first two commits wholesale into the smaller PRs; both mix unrelated ticket issues.

## Source branch

- Branch: `unit-tests`
- Current head: `a2adb603f1711ca3db6528adbdc448b11b98568f`
- Stage baseline used for the split: `origin/stage` at `46291e277a41ce479d3071b3106cadcc8170367d`
- Net original PR size against that stage baseline: 101 files, 589 additions, 599 deletions

Original branch commits, oldest first:

1. `04b48e953` — `first attempt at refactoring unit tests`
2. `be5775b1b` — `test revision`
3. `ddb8ad530` — merge `stage` into `unit-tests`
4. `427b74f83` — color-how-to merge-conflict repair
5. `a2adb603f` — stage integration fixes for feature-grid, frictionless quick action, and gallery

## Why the original PR is being split

The ticket identified separate failure classes:

1. Production bootstrap executing during unit imports.
2. Broken or permissive WTR network/XHR/script guards and an unpinned viewport.
3. Gallery dependence on IntersectionObserver, rendering, and smooth-scroll timing.
4. Fixed-time waits under background-tab timer throttling.
5. Fetch stubs and module caches leaking between tests.
6. Shared localStorage cleanup clearing other parallel pages.
7. Tests with detached or otherwise ineffective assertions.
8. The MWPW-192264 skip graveyard and nondeterministic browser APIs.

These have different risk, reviewers, and dependencies. The first two source commits span nearly all eight categories, so commit boundaries are not suitable PR boundaries.

## Worktrees created

| Split | Branch | Worktree | Commit | Base |
| --- | --- | --- | --- | --- |
| PR 1 — bootstrap containment | `unit-tests-bootstrap-containment` | `.claude/worktrees/unit-tests-bootstrap-containment` | `34ba15b92` | `origin/stage` at `46291e277` |
| PR 6 — ratings localStorage isolation | `unit-tests-localstorage-isolation` | `.claude/worktrees/unit-tests-localstorage-isolation` | `7eb625368` | `origin/stage` at `46291e277` |

Both branches contain committed changes and are ready to push or rebase. Neither includes the stage merge commit from the original branch.

## PR 1: bootstrap containment

Branch: `unit-tests-bootstrap-containment`

Scope:

- Set `window.isTestEnv = true` in `testRunnerHtml` before the test framework or test module loads.
- Move the test guard in `scripts.js` until after shared Milo configuration is initialized.
- Await test-only `loadPage()` initialization so importers observe deterministic config.
- Return before production page bootstrap, external scripts, `loadArea()`, and other page side effects.
- Remove all 99 redundant, late, or misspelled per-file assignments across 77 test files.
- Remove hooks and comments made empty or stale by centralizing the guard.

Intentionally excluded:

- XHR/fetch/script enforcement and viewport pinning; those belong to PR 2.
- Gallery production and test changes; those belong to PR 3.
- Wait helpers, stub cleanup, storage cleanup, false-positive tests, and restored skipped tests.

Validation:

- ESLint: zero errors across every changed JavaScript file.
- `git diff --check`: clean.
- Full WTR without coverage, run twice after porting/formatting: 4,149 passed, 0 failed, 99 skipped.
- Stage gallery test with coverage in isolation: 2 passed, 0 failed.
- A full coverage-mode attempt remained affected by the ticket's load-dependent stage test behavior, which is intentionally handled in PR 3. Do not claim the five-run CI acceptance criterion from PR 1 alone.

Review note: most of this PR's file count is mechanical deletion. The substantive behavior is confined to `express/code/scripts/scripts.js` and `web-test-runner.config.js`.

## PR 6: ratings localStorage isolation

Branch: `unit-tests-localstorage-isolation`

Scope:

- Replace both `localStorage.clear()` calls in the ratings suite with removal of only:
  - `ccxActionRatings`
  - `ccxActionRatingsFeedbacknalaTestRatings`
- Run targeted cleanup before and after each affected test group.
- Preserve unrelated same-origin keys owned by concurrently running WTR pages.
- Retain interval cleanup already present in the ratings suite.

Intentionally excluded:

- Bootstrap guard cleanup, including the ratings file's existing `window.isTestEnv` assignment.
- Other timer and ratings production changes.
- Any general localStorage abstraction.

Validation:

- Ratings WTR with coverage: 26 passed, 0 failed; 47.31% targeted coverage.
- ESLint: passed.
- `git diff --check`: clean.

The stage harness still logs its known `XMLHttpRequest.open` `resource is not defined` error during this targeted run. That is pre-existing stage behavior assigned to PR 2, not part of this localStorage change.

## Remaining proposed PRs

| PR | Single issue | Changes to extract from `unit-tests` |
| --- | --- | --- |
| 2 | Harness correctness and zero real network | Fix XHR, reject external fetch/XHR/script loads, deterministic Geo2 response, pin viewport, add Chrome launcher, and suppress the frictionless SDK preload in its unit suite. The `scripts.js` unhandled-rejection propagation issue is still unimplemented and should be handled or explicitly deferred here. |
| 3 | Gallery load-dependent flake | Synchronous initial gallery state, direction-normalized scroll math, geometry fallback, synthetic LTR/RTL tests, no smooth-scroll timing, no fixed delays, and removal of stage's `bring-to-front` workaround. |
| 4 | Fixed-time waits | Improve and test `waitFor`; convert the comparison-table and template-x-promo hotspots to awaited observable state. This is only the first tranche: timer waits remain elsewhere. |
| 5 | Fetch-stub and cache discipline | Sinon restore discipline, ESLint enforcement against direct `window.fetch` assignment, and all-templates metadata cache/fallback isolation. |
| 7 | Tests that could not fail | Await compact-nav assertions; fix frictionless dynamic-import setup and replace its detached MutationObserver assertion with observable behavior. |
| 8 | MWPW-192264 skip graveyard | Re-enable modal, drawer, color-input, strip-renderer, toolbar, gradient-modal, and blog-feature coverage with deterministic rAF, media-query, CSS, and observer behavior. |

## Dependency and landing order

1. Land PR 1 before PR 2 and PR 3.
2. PR 6 is independent and may land at any time.
3. Land PR 4 before PR 7 and PR 8 because those changes consume the improved `waitFor` behavior.
4. Land PR 2 before PR 8 so restored browser-dependent coverage runs under the pinned harness.
5. PR 5 is largely independent, but landing it before the strict external-network guard reduces integration noise.

Do not create a generic `stage fixes` PR:

- The color-how-to helper signature and feature-grid fixture lifecycle already exist on stage and were only merge-conflict repairs on `unit-tests`.
- Fold the gallery changes into PR 3.
- Fold frictionless preload suppression into PR 2 and its false-positive assertion repair into PR 7.

## Current integration evidence

On the original combined `unit-tests` branch, the latest completed verification was:

- Native WTR with coverage: 4,251 passed, 0 failed, 0 skipped.
- Docker/`act` Linux CI simulation: 4,251 passed, 0 failed; job succeeded.

This demonstrates the fixes work together, but it does not replace per-PR validation or the ticket's acceptance requirement of five consecutive green main/stage CI runs.

## Known remaining gaps

- At least 70 awaited delay or Promise/setTimeout patterns remain across 23 test files.
- `scripts.js` still has an `unhandledrejection` listener that calls `stopImmediatePropagation()`, which can suppress WTR attribution.
- Production timer leakage in ratings, quotes, hero-color, and color-how-to carousel is not comprehensively addressed.
- The five-consecutive-CI-run acceptance criterion has not yet been demonstrated on main/stage.
- The strict external-network harness must land only after bootstrap containment and required test-specific network suppression are in place.

## Rebase guidance

Before opening each PR:

1. Fetch and rebase the focused branch onto the latest `origin/stage`.
2. Resolve conflicts using stage as the baseline; do not reintroduce `ddb8ad530`.
3. Run the focused tests and the full WTR coverage command used by CI.
4. Confirm the diff contains only the issue named by that split.
5. Update this document if branch names, dependencies, validation, or deferred work changes.
