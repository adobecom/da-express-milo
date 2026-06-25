---
name: nala-test-generation
description: >
  Generates Nala E2E tests for a block or page. Creates the standard
  3-file structure (spec, test, page object) matching the patterns used
  in nala/blocks/. Requires a block name and one or more test page paths.
---

# Nala Test Generation Skill

Nala is the E2E testing framework used in `adobecom/da-express-milo`.
Tests live under `nala/blocks/<block-name>/` and follow a strict 3-file
structure.  This skill generates all three files.

---

## Inputs

Ask the user to provide:

| Input | Required | Example |
|-------|----------|---------|
| **Block name** (kebab-case) | Yes | `ax-marquee`, `color-headline` |
| **Test page paths** | At least one | `/express/colors/red` |
| **Tags** | No (defaults shown below) | `@smoke @regression` |
| **What to test** | No | "pill carousel, arrow buttons" |

---

## File structure

```
nala/blocks/<block-name>/
  <block-name>.spec.js   ← feature config: test IDs, paths, tags
  <block-name>.test.js   ← Playwright test assertions
  <block-name>.page.js   ← page object: block locators
```

---

## 1. Read existing examples first

Before generating, read **2 existing Nala test suites** from `nala/blocks/`
to understand the current conventions in this repo.  Good examples:
- `nala/blocks/ckg-link-list/` (carousel/interactive)
- `nala/blocks/color-headline/` (simpler, good spec.js pattern)

---

## 2. Generate `<block-name>.spec.js`

Feature config — one entry per test scenario:

```js
module.exports = {
  name: '<Block Name> block',
  features: [
    {
      tcid: '0',
      name: '@<block-name>',
      path: '/express/<page-path>',
      tags: '@express @regression @<block-name>',
    },
    // Add more features for locale, variant, or device-specific tests
    {
      tcid: '1',
      name: '@<block-name>-locale',
      path: '/de/express/<page-path>',
      tags: '@express @regression @<block-name> @locale',
    },
  ],
};
```

- `tcid` is a sequential integer string starting at `'0'`.
- `name` starts with `@<block-name>` (enables `npm run nala stage @<block-name>` to filter).
- `tags` includes `@express @regression @<block-name>` at minimum.
- `path` is always a relative path — **never a full URL**.

---

## 3. Generate `<block-name>.page.js`

Page object — locators only, no assertions:

```js
export default class <ClassName> {
  constructor(page) {
    this.page = page;
    // Block root
    this.<blockCamel> = page.locator('.<block-name>');
    // Key child elements (derive from Figma or DOM inspection)
    this.heading = page.locator('.<block-name> h1, .<block-name> h2').first();
    this.ctaButton = page.locator('.<block-name> a.button').first();
    this.image = page.locator('.<block-name> img').first();
    // Interactive elements (if applicable)
    // this.nextArrow = page.locator('.<block-name> .arrow-right');
  }
}
```

- Only locators in this file — no `expect`, no `await page.goto`.
- Name locators after what they represent (`.heading`, `.ctaButton`), not
  after their implementation (`.divFirstChild`).

---

## 4. Generate `<block-name>.test.js`

Playwright tests — import from spec and page files:

```js
import { expect, test } from '@playwright/test';
import { features } from './<block-name>.spec.js';
import <ClassName> from './<block-name>.page.js';

let block;

test.describe('<Block Name> Block Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    block = new <ClassName>(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    await test.step('Go to <block-name> test page', async () => {
      await page.goto(`${baseURL}${features[0].path}`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(`${baseURL}${features[0].path}`);
    });

    await test.step('Verify block is visible', async () => {
      await block.<blockCamel>.scrollIntoViewIfNeeded();
      await expect(block.<blockCamel>).toBeVisible();
    });

    await test.step('Verify heading content', async () => {
      await expect(block.heading).toBeVisible();
      const text = await block.heading.innerText();
      expect(text.length).toBeTruthy();
    });

    await test.step('Verify CTA is present and has href', async () => {
      if (await block.ctaButton.count() > 0) {
        await expect(block.ctaButton).toBeVisible();
        await expect(block.ctaButton).toHaveAttribute('href');
      }
    });
  });
});
```

### Test step conventions
- Each logical check is a `test.step` with a descriptive label.
- Check element count before asserting on optional elements
  (`if (await locator.count() > 0)`).
- Use `page.waitForLoadState('domcontentloaded')` after navigation.
- Add `page.waitForTimeout(2000)` only before interactions that need
  animation to settle (e.g. carousel transitions) — not as a general delay.
- For interactive elements (buttons, carousels), test the state change
  (before click → after click).

---

## 5. Anti-patterns to avoid

```js
// ❌ Hard-coded full URLs
await page.goto('https://stage--da-express-milo--adobecom.aem.page/express/');

// ✅ Environment-agnostic paths via baseURL fixture
await page.goto(`${baseURL}/express/`);

// ❌ Fixed wait times
await page.waitForTimeout(5000);

// ✅ Wait for specific conditions
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible();

// ❌ Brittle nth-child selectors
page.locator('div > div:nth-child(2) > p:first-child')

// ✅ Semantic/class selectors
page.locator('.<block-name> .cta a').first()
```

---

## 6. Running the generated tests

```bash
# Run all tests for this block
npm run nala stage @<block-name>

# Run smoke tests only
npm run nala stage @<block-name> @smoke

# Run on a specific environment
npm run nala prod @<block-name>
```

---

## 7. Summary

After generating, output:
1. The three file paths created.
2. The test IDs and what each one covers.
3. Any elements or interactions you assumed from the block name — ask
   the user to confirm they match the actual block's content.
