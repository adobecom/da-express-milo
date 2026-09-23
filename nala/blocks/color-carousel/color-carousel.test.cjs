/* eslint-disable no-await-in-loop */
const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-carousel.spec.cjs');
const ColorCarouselBlock = require('./color-carousel.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

test.describe('ColorCarouselBlock Test Suite', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  async function verifyChips(block) {
    const total = await block.chip.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i += 1) {
      const chip = block.chip.nth(i);
      await expect(chip.locator('.color-carousel-chip-name')).not.toBeEmpty();

      const hex = (await chip.locator('.color-carousel-chip-hex').innerText()).trim();
      expect(hex).toMatch(HEX_PATTERN);

      // Swatch is tinted to the chip's hex, so it must not be transparent.
      const bgColor = await chip.locator('.color-carousel-chip-swatch')
        .evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  }

  // Test Id : 0 : @color-carousel-authored
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
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
      // The authored variant must not opt into the dynamic ckg failsafe.
      await expect(block.block).not.toHaveClass(/\bckg\b/);
      await verifyChips(block);
    });

    await test.step('step-3: Verify optional heading and chip links', async () => {
      await expect(block.header).toBeVisible();
      const linkCount = await block.chipLink.count();
      expect(linkCount).toBeGreaterThan(0);
      for (let i = 0; i < linkCount; i += 1) {
        const href = await block.chipLink.nth(i).getAttribute('href');
        expect(href).toBeTruthy();
      }
    });

    await test.step('step-4: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: true });
    });
  });

  // Test Id : 1 : @color-carousel-ckg
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
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
    });

    await test.step('step-3: Verify chip links point to color pages', async () => {
      const linkCount = await block.chipLink.count();
      expect(linkCount).toBeGreaterThan(0);
      for (let i = 0; i < linkCount; i += 1) {
        const href = await block.chipLink.nth(i).getAttribute('href');
        expect(href).toContain('/express/colors/');
      }
    });

    await test.step('step-4: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: true });
    });
  });
});
