# da-express-milo — Claude Code Rules

## E2E Test Authoring Rules (Nala / Playwright)

These rules exist so a testing agent can write correct, passing test files in one shot without iteration.

---

### 1. File structure — always 3 files per block

Every block test lives under `nala/blocks/<block-name>/` and must have exactly these 3 files:

```
nala/blocks/<block-name>/
  <block-name>.page.cjs   ← Page Object Model (locators + action helpers)
  <block-name>.spec.cjs   ← Test data (paths, expected text, tags)
  <block-name>.test.cjs   ← Test execution (imports page + spec, runs steps)
```

---

### 2. File format — always `.cjs`, never `.js`

Playwright config uses `testMatch: '**/*.test.cjs'`. All three files must be `.cjs`.

---

### 3. Test page URLs — use `/drafts/nala/` paths, never real feature pages

Real feature pages (e.g. `/express/feature/image/resize`) may not exist or render blank during `domcontentloaded`. All test pages must be pre-created AEM draft pages.

**Correct pattern:**
```
/drafts/nala/test-gen/<block-name>/<variant>
/drafts/nala/blocks/<block-name>/<variant>
```

**Reference:** `nala/assets/urls.txt` lists all confirmed-live test pages.

**Existing confirmed paths for frictionless blocks:**
```
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-remove-background
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-resize
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-crop
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-convert-to-jpg
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-convert-to-png
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-convert-to-svg
/drafts/nala/test-gen/frictionless-qa-image/fqa-image-change-background
```

---

### 4. Block class locators — account for block class variants

The Helix block class comes from the folder name. Some blocks have desktop and mobile variants:
- Desktop: `.frictionless-quick-action`
- Mobile: `.frictionless-quick-action-mobile`

Use `[class*="block-name"]` to match both variants:
```js
const BLOCK_SELECTOR = '[class*="frictionless-quick-action"]';
page.locator(`${BLOCK_SELECTOR}[data-frictionlesstype=remove-background]`)
```

`data-frictionlesstype` is set by JavaScript in `decorate()` — it is present after `domcontentloaded` fires.

---

### 5. Upload button — two variants exist

The upload button differs between desktop and mobile block variants:

| Block variant | Upload element |
|---|---|
| `frictionless-quick-action` (desktop draft pages) | `page.getByRole('link', { name: 'Upload your photo' })` |
| `frictionless-quick-action-mobile` | `page.locator('button.dropzone#mobile-fqa-upload')` |

Always use `.or()` to handle both:
```js
this.uploadButton = page.getByRole('link', { name: 'Upload your photo' })
  .or(page.locator('button.dropzone#mobile-fqa-upload'));
```

---

### 6. Page load — always use `domcontentloaded`, not `networkidle`

```js
await page.goto(testUrl);
await page.waitForLoadState('domcontentloaded');
await expect(page).toHaveURL(testUrl);
```

`networkidle` is too slow for these pages. `domcontentloaded` is sufficient — block JS runs synchronously after it.

---

### 7. Mobile-only locators — do not assert on desktop draft pages

`.express-logo` and `button.dropzone#mobile-fqa-upload` only exist in `frictionless-quick-action-mobile`. Do not assert these when using desktop draft pages (`/drafts/nala/test-gen/frictionless-qa-image/...`).

Only assert mobile-specific elements when the test page actually uses the mobile block.

---

### 8. File upload pattern — always use `waitForEvent('filechooser')`

```js
const fileChooserPromise = this.page.waitForEvent('filechooser', { timeout: 15000 });
await this.uploadButton.click();
const fileChooser = await fileChooserPromise;
await fileChooser.setFiles(filePath);
await this.page.waitForTimeout(5000); // SDK init time
```

Set up the promise BEFORE clicking. Never `page.setInputFiles()` directly.

---

### 9. Test assets — use files from `nala/assets/`

```js
const pngImageFilePath = path.resolve(process.cwd(), 'nala', 'assets', 'test-image.png');
const jpgImageFilePath = path.resolve(process.cwd(), 'nala', 'assets', 'test-image.jpg');
const videoFilePath    = path.resolve(process.cwd(), 'nala', 'assets', 'test-video.mp4');
```

Available: `test-image.png`, `test-image.jpg`, `test-video.mp4`.

---

### 10. Standard test step structure — 4 steps per test

Every test must follow this step order:

```js
// Step 1 — Navigate
await test.step('Navigate to <block> page', async () => {
  await page.goto(testUrl);
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(testUrl);
});

// Step 2 — Verify block content
await test.step('Verify block is visible and upload button is present', async () => {
  await expect(block.type.remove_background).toBeVisible();
  await expect(block.uploadButton).toBeVisible({ timeout: 15000 });
});

// Step 3 — Accessibility
await test.step('Verify accessibility', async () => {
  await runAccessibilityTest({ page, testScope: block.type.remove_background });
});

// Step 4 — Analytics
await test.step('Verify analytics attributes', async () => {
  await expect(block.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
  await expect(block.block).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('<block-name>', 1));
});

// Step 5 — Core interaction: upload → verify Express opens in embed iframe
await test.step('Upload image and verify Express opens in embed mode', async () => {
  await block.uploadFile(pngImageFilePath);
  await expect(block.quickActionContainer).toBeVisible({ timeout: 30000 });
  await expect(block.embedIframe).toBeVisible({ timeout: 30000 });
});
```

The full post-upload flow to assert:
```
upload file
  → .quick-action-container appears   (SDK container injected into DOM)
  → iframe inside container visible   (Express editor loaded in embed mode)
```

The iframe is located via `this.quickActionContainer.locator('iframe').nth(0)` in the page object. Use `timeout: 30000` — the CCEverywhere SDK takes a few seconds to bootstrap and render the iframe.

---

### 11. Interacting inside the Express embed iframe

The CCEverywhere iframe is cross-origin (Adobe Express domain vs `aem.live`). Use `frameLocator` — Playwright can click/type inside cross-origin iframes but cannot `evaluate()` their DOM.

**Page object provides:**
```js
getExpressFrame() {
  return this.page.frameLocator('.quick-action-container iframe');
}
```

**Usage in tests:**
```js
const frame = fqaMobile.getExpressFrame();
await expect(frame.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 30000 });
await frame.getByRole('button', { name: 'Download' }).click();
```

**To discover selectors inside the iframe:** run with `PWDEBUG=1` to open Playwright Inspector, use "Pick locator" and hover over elements inside the iframe.

```bash
PWDEBUG=1 npx playwright test --grep "@<tag>" --project="express-live-chromium"
```

---

### 13. spec.cjs structure

```js
module.exports = {
  name: 'Express <block-name> block',
  features: [
    {
      tcid: '0',
      name: '@<block-name> <variant description>',
      path: '/drafts/nala/test-gen/<block-name>/<variant>',
      data: {
        // expected text values for assertions
      },
      tags: '@<block-name> @<variant-tag> @express @smoke @regression @t1',
    },
  ],
};
```

Tag tiers: `@t1` = smoke/critical, `@t2` = regression, `@t3` = edge cases.

---

### 14. test.cjs imports — always include these

```js
import path from 'path';
import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './<block-name>.spec.cjs';
import <PageClass> from './<block-name>.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';
```

---

### 13. Running tests locally

```bash
# Single test by tag, one browser
npx playwright test --grep "@<tag>" --project="express-live-chromium"

# Headed (watch it run in browser)
npx playwright test --grep "@<tag>" --project="express-live-chromium" --headed

# Headed with slow motion
npx playwright test --grep "@<tag>" --project="express-live-chromium" --headed --slowmo=500

# All tests in a block
npx playwright test nala/blocks/<block-name>/ --project="express-live-chromium"
```

Available projects: `express-live-chromium`, `express-live-firefox`, `express-live-webkit`, `mobile-chrome-pixel5`, `mobile-safari-iPhone12`.

Install missing browsers with: `npx playwright install`

---

### 14. baseURL resolution order

1. `PR_BRANCH_LIVE_URL` env var — set this for PR branch testing
2. `LOCAL_TEST_LIVE_URL` env var — set this for local overrides
3. Default: `https://main--da-express-milo--adobecom.aem.live`

To test against a PR branch:
```bash
PR_BRANCH_LIVE_URL=https://<branch>--da-express-milo--adobecom.aem.live \
  npx playwright test --grep "@<tag>"
```
