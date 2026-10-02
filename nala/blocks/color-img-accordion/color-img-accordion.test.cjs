/* eslint-disable no-await-in-loop, no-restricted-syntax */
const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-img-accordion.spec.cjs');
const ColorImgAccordionBlock = require('./color-img-accordion.page.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('ColorImgAccordionBlock Test Suite', () => {
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new ColorImgAccordionBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
      await expect(block.block).toBeVisible();
    });

    await test.step('step-2: Verify block content', async () => {
      const sem = data.semantic;
      for (const text of sem.texts) {
        await expect(block.block.locator(text.selector).nth(text.nth || 0)).toContainText(text.text);
      }
      for (const media of sem.media) {
        const locator = block.block.locator(media.selector).nth(media.nth || 0);
        await expect(media.tag === 'picture' ? locator.locator('img') : locator).toBeVisible();
      }
      for (const interactive of sem.interactives) {
        const locator = block.block.locator(interactive.selector).nth(interactive.nth || 0);
        await expect(locator).toBeVisible();
        if (interactive.text) await expect(locator).toContainText(interactive.text);
      }

      await expect(block.image).toBeVisible();
      await expect(block.swatches).toHaveCount(6);
      await expect(block.palette).toHaveClass(/is-ready/);
      const swatchColors = await block.swatches.evaluateAll((swatches) => (
        swatches.map((swatch) => getComputedStyle(swatch).backgroundColor)
      ));
      expect(new Set(swatchColors).size).toBeGreaterThan(1);
      const imageBox = await block.image.boundingBox();
      const paletteBox = await block.palette.boundingBox();
      expect(Math.abs(imageBox.x - paletteBox.x)).toBeLessThan(1);
      expect(Math.abs(imageBox.width - paletteBox.width)).toBeLessThan(1);
      expect(Math.abs(imageBox.y + imageBox.height - paletteBox.y)).toBeLessThan(1);
      await expect(block.buttons).toHaveCount(4);
      await expect(block.buttons.first()).toHaveAttribute('aria-expanded', 'true');
    });

    await test.step('step-3: Verify multiple-open behavior', async () => {
      await block.buttons.nth(1).click();
      await expect(block.buttons.first()).toHaveAttribute('aria-expanded', 'true');
      await expect(block.buttons.nth(1)).toHaveAttribute('aria-expanded', 'true');
      await expect(block.panels.first()).toHaveAttribute('aria-hidden', 'false');
      await expect(block.panels.nth(1)).toHaveAttribute('aria-hidden', 'false');
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
