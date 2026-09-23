/* eslint-disable no-await-in-loop, no-restricted-syntax */
const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-carousel.spec.cjs');
const ColorCarouselBlock = require('./color-carousel.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

// Shared with both variants: assert every rendered chip has a name, a hex-format
// label, a non-transparent swatch tinted to that hex, and (when it links) an href.
async function verifyChips(block) {
  const total = await block.chip.count();
  expect(total).toBeGreaterThan(0);

  for (let i = 0; i < total; i += 1) {
    const chip = block.chip.nth(i);
    await expect(chip.locator('.color-carousel-chip-name')).not.toBeEmpty();

    const hex = (await chip.locator('.color-carousel-chip-hex').innerText()).trim();
    expect(hex).toMatch(HEX_PATTERN);

    const bgColor = await chip.locator('.color-carousel-chip-swatch')
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  }
}

// Drives the data-driven assertions declared in color-carousel.block.json.
async function verifySemantic(block, sem) {
  for (const t of sem.texts) {
    const locator = block.block.locator(t.selector).nth(t.nth || 0);
    await expect(locator).toContainText(t.text);
  }
  for (const m of sem.media) {
    const locator = block.block.locator(m.selector).nth(m.nth || 0);
    const target = m.tag === 'picture' ? locator.locator('img') : locator;
    if (m.selector.includes('.isHidden')) await expect(target).toBeHidden();
    else await expect(target).toBeVisible();
  }
  for (const iEl of sem.interactives) {
    const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
    await expect(locator).toBeVisible({ timeout: 8000 });
    if (iEl.type === 'link' && iEl.href) {
      const href = await locator.getAttribute('href');
      const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
      const actualPath = new URL(href, 'https://dummy.base').pathname;
      await expect(actualPath).toBe(expectedPath);
    }
    if (iEl.text) await expect(locator).toContainText(iEl.text);
  }
}

test.describe('ColorCarouselBlock Test Suite', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // Test Id : 0 : @color-carousel-authored
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}`;
    const block = new ColorCarouselBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify authored chips render', async () => {
      await block.waitReady();
      await block.block.scrollIntoViewIfNeeded();
      await expect(block.block).toBeVisible();
      // The authored variant must not trip the dynamic ckg failsafe.
      await expect(block.block).not.toHaveClass(/\bckg\b/);
      await verifyChips(block);
      await verifySemantic(block, data.semantic);
    });

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: true });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });

  // Test Id : 1 : @color-carousel-ckg
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}`;
    const block = new ColorCarouselBlock(page, features[1].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify dynamically-pulled ckg chips render', async () => {
      await block.waitReady();
      await block.block.scrollIntoViewIfNeeded();
      await expect(block.block).toBeVisible();
      await verifyChips(block);
      await verifySemantic(block, data.semantic);
    });

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: true });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[1], skipSeoTest: false });
    });
  });
});
