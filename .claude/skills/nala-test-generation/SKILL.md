---
name: nala-test-generation
description: >
  Generates Nala E2E tests for a block or page. Creates the standard
  4-file structure (block.json, spec, test, page object) matching the
  pattern produced by `npm run nala-test-gen`. Optionally creates a
  minimal DA test page for the block.
---

# Nala Test Generation Skill

Nala is the E2E testing framework used in `adobecom/da-express-milo`.
Tests live under `nala/blocks/<block-name>/` and follow a strict 4-file
structure that matches the output of `npm run nala-test-gen`.

---

## Inputs

| Input | Required | Notes |
|-------|----------|-------|
| **Block name** (kebab-case) | Yes | e.g. `ax-marquee`, `font-generator` |
| **Test page path** | No — ask | Relative path e.g. `/drafts/nala/test-gen/font-generator`. If not provided, offer to create the page (see Phase 2). |

---

## Phase 1 — Collect inputs

Ask for the block name if not provided.

Then ask about the test page:

> Do you have an existing test page path, or should I create one?
> - **I have a path** — provide the relative path (e.g. `/drafts/nala/test-gen/font-generator`)
> - **Create it for me** — I'll build a minimal DA page and give you the path

If the user provides a path, skip to Phase 3.
If the user wants a page created, continue to Phase 2.

---

## Phase 2 — Create the DA test page (optional)

The test page is a minimal EDS document containing just the block under test
with a lorem ipsum sentence. It is uploaded to DA under:

```
adobecom / da-express-milo / drafts/nala/test-gen/<block-name>.html
```

The nala path (used in `block.json`) will be:
```
/drafts/nala/test-gen/<block-name>
```

### 2a. Build the HTML

The document uses the standard EDS block authoring table format.
The first table row names the block; the second row contains a single
lorem ipsum sentence as placeholder content.

```html
<!DOCTYPE html>
<html>
  <head><title><block-name></title></head>
  <body>
    <header></header>
    <main>
      <div>
        <table>
          <tbody>
            <tr><td><block-name></td></tr>
            <tr><td>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</td></tr>
          </tbody>
        </table>
      </div>
    </main>
    <footer></footer>
  </body>
</html>
```

Save to `/tmp/da-upload/drafts/nala/test-gen/<block-name>.html`.

### 2b. Check DA auth token

```bash
da-auth-helper token >/dev/null 2>&1 && echo "Token OK" || echo "No token"
```

If no token, instruct the user to:
1. Install: `npm install -g github:adobe-rnd/da-auth-helper`
2. Log in: `da-auth-helper login` (opens browser — choose the **Skyline** profile)
3. Verify: `da-auth-helper token`

### 2c. Upload HTML to DA

```bash
TOKEN=$(da-auth-helper token 2>/dev/null)

curl -s -w "\n%{http_code}" -X POST \
  "https://admin.da.live/source/adobecom/da-express-milo/drafts/nala/test-gen/<block-name>.html" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: text/html" \
  --data-binary @/tmp/da-upload/drafts/nala/test-gen/<block-name>.html
```

Expect **200** or **201**.

### 2d. Preview the page

```bash
curl -s -w "\n%{http_code}" -X POST \
  "https://admin.hlx.page/preview/adobecom/da-express-milo/main/drafts/nala/test-gen/<block-name>" \
  -H "Authorization: Bearer $TOKEN"
```

Report the preview URL:
```
Preview: https://main--da-express-milo--adobecom.aem.page/drafts/nala/test-gen/<block-name>
```

The nala path for `block.json` is: `/drafts/nala/test-gen/<block-name>`

---

## Phase 3 — Generate the 4 nala test files

Files go in `nala/blocks/<block-name>/`. All files use **CommonJS** (`.cjs`).

### 3a. `<block-name>.block.json`

This is the data source. The spec file reads from it; do not duplicate data.

```json
{
  "block": "<block-name>",
  "variants": [
    {
      "tcid": "0",
      "name": "@<block-name>-default",
      "selector": "div.<block-name>",
      "path": "<test-page-path>",
      "data": {
        "semantic": {
          "texts": [],
          "media": [],
          "interactives": []
        }
      },
      "tags": [
        "@<block-name>",
        "@default",
        "@express"
      ]
    }
  ]
}
```

`texts`, `media`, and `interactives` start empty — they are populated as
the block gains real content. The test loops over them automatically.

### 3b. `<block-name>.spec.cjs`

```js
const schema = require('./<block-name>.block.json');

module.exports = { features: schema.variants };
```

### 3c. `<block-name>.page.cjs`

Minimal page object. Locators are added here as the block is implemented.

```js
class <ClassName>Block {
  constructor(page, selector = '.<block-name>', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = <ClassName>Block;
```

`<ClassName>` is the PascalCase version of the block name
(e.g. `font-generator` → `FontGenerator`).

### 3d. `<block-name>.test.cjs`

One test per variant in the block.json. Each test follows the standard
4-step template: navigate → verify block content (driven by `data.semantic`)
→ accessibility → SEO.

```js
const { test, expect } = require('@playwright/test');
const { features } = require('./<block-name>.spec.cjs');
const <ClassName>Block = require('./<block-name>.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('<ClassName>Block Test Suite', () => {
  // Test Id : 0 : @<block-name>-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new <ClassName>Block(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block content', async () => {
      await expect(block.block).toBeVisible();
      const sem = data.semantic;

      for (const t of sem.texts) {
        const locator = block.block.locator(t.selector).nth(t.nth || 0);
        await expect(locator).toContainText(t.text);
      }

      for (const m of sem.media) {
        const locator = block.block.locator(m.selector).nth(m.nth || 0);
        const isHiddenSelector = m.selector.includes('.isHidden');
        const isPicture = m.tag === 'picture';
        const target = isPicture ? locator.locator('img') : locator;
        if (isHiddenSelector) {
          await expect(target).toBeHidden();
        } else {
          await expect(target).toBeVisible();
        }
      }

      for (const iEl of sem.interactives) {
        const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
        await expect(locator).toBeVisible({ timeout: 8000 });
        if (iEl.type === 'link' && iEl.href) {
          const href = await locator.getAttribute('href');
          if (/^(tel:|mailto:|sms:|ftp:|[+]?[\d])/i.test(iEl.href)) {
            await expect(href).toBe(iEl.href);
          } else {
            const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
            const actualPath = new URL(href, 'https://dummy.base').pathname;
            await expect(actualPath).toBe(expectedPath);
          }
        }
        if (iEl.text) await expect(locator).toContainText(iEl.text);
      }
    });

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
```

For blocks with multiple variants, generate one `test(...)` block per entry
in `schema.variants`, following the same 4-step template each time.

---

## Phase 4 — Verify tests locally

Always run against the local dev server — the block code is not on main/stage.

If port 3000 is not listening, start it first: `aem up --port 3000 &`

```bash
npm run nala local @<block-name>
```

---

## Phase 5 — Summary

Report:
1. The four file paths created under `nala/blocks/<block-name>/`.
2. The test page path used (provided or newly created).
3. A note that `data.semantic.texts`, `media`, and `interactives` in
   `block.json` are empty scaffolds — populate them as the block is built.
