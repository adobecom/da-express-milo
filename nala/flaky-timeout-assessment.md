# NALA Flaky / Timeout Risk Assessment

Date: 2026-03-03  
Branch: `flakey-tests-fix`

## Top candidates likely to flake or timeout

1. `nala/blocks/print-product-detail/accordion.test.cjs` (very high risk)
   - Heavy use of `waitForTimeout(...)` throughout test flow.
   - Uses timing-sensitive checks (`Date.now()` duration assertions).
   - Relies on shared page-global state (`window.testExpandedTitle`).
   - Risk: race conditions and timing drift across CI/browser environments.

2. `nala/blocks/template-x-promo/template-x-promo.test.cjs` (very high risk)
   - Large number of fixed waits (including multi-second sleeps).
   - Repeated `networkidle` synchronization for readiness.
   - Broad selectors (`.template`, `[class*="template"]`) not scoped to block root.
   - Long multi-viewport flows in single tests increase cumulative timeout risk.

3. `nala/blocks/frictionless-qa-video/frictionless-qa-video.test.cjs` + `nala/blocks/frictionless-qa-video/frictionless-qa-video.page.cjs` (high risk)
   - External upload and iframe-dependent flows.
   - Repeated long visibility waits (`timeout: 30000`) plus fixed 5s waits.
   - Risk: backend latency and iframe load variance causing intermittent failures.

4. `nala/blocks/template-promo-carousel/template-promo-carousel.test.cjs` + `nala/blocks/template-promo-carousel/template-promo-carousel.page.cjs` (high risk)
   - Frequent `waitForLoadState('networkidle').catch(() => {})`.
   - Empty catches suppress real readiness/load failures.
   - Risk: false positives and nondeterministic pass/fail outcomes.

5. `nala/blocks/wayfinder/wayfinder.test.cjs` (medium-high risk)
   - Hover behavior validated with fixed 1s waits.
   - Styling assertions after timing delays.
   - Risk: animation/input timing differences across browser and CI load.

6. `nala/blocks/print-product-detail/print-product-detail.test.cjs` (medium-high risk)
   - Broad generic selectors (`button:visible, a.button:visible`).
   - Hard waits and interaction try/catch that can continue after issues.
   - Risk: unstable element targeting and masked failures.

7. `nala/monitoring/pricing-page-check.test.cjs` + `nala/monitoring/homepage-pricing-check.test.cjs` (medium-high environmental risk)
   - Depend on external `www.adobe.com` locale endpoints.
   - Long navigation/attach waits and external environment variability.
   - Risk: network/edge/content changes outside repo control.

8. `nala/blocks/how-to-v2/how-to-v2.test.cjs` (medium timeout risk)
   - Long sequential "all-in-one" test flow.
   - Multiple waits, loops, and viewport transitions in one case.
   - Risk: occasional timeout from cumulative runtime.

## Systemic risk signals

- `playwright.config.cjs`:
  - `timeout: 45 * 1000`
  - `fullyParallel: true`
  - `retries: process.env.CI ? 1 : 0`
- Many NALA tests use fixed sleeps instead of deterministic state waits.
- Several tests depend on `networkidle` as a proxy for app readiness.
- Some helpers/tests swallow errors with empty catches.

## Suggested stabilization priority (quick wins first)

1. Remove empty catches and fail fast in `template-promo-carousel`.
2. Replace fixed waits in `accordion` and `template-x-promo` with state-based assertions.
3. Scope selectors to block root in `template-x-promo` and print-product-detail tests.
4. Split long sequential tests (`how-to-v2`, parts of `template-x-promo`) into smaller independent cases.
5. Isolate external dependency-heavy flows (`frictionless-qa-video`, monitoring) as dedicated suites with explicit diagnostics.

## Refactor patterns to apply

- Prefer:
  - `await expect(locator).toBeVisible()` / `toHaveAttribute()` / `toHaveCount()`
  - `await page.waitForFunction(() => ...)` using app-state conditions
  - Scoped locators rooted at the block container
- Avoid:
  - `waitForTimeout(...)` for readiness
  - global mutable state via `window.*` in test logic
  - broad selectors matching unrelated page content
  - empty `.catch(() => {})` around critical readiness waits
