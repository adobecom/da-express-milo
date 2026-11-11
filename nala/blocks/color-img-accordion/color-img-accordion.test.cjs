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
      // Swatches fade in via a background-color transition; poll until they settle.
      await expect.poll(async () => {
        const swatchColors = await block.swatches.evaluateAll((swatches) => (
          swatches.map((swatch) => getComputedStyle(swatch).backgroundColor)
        ));
        return new Set(swatchColors).size;
      }).toBeGreaterThan(1);
      // Photo is 16:9; palette height scales with the photo width
      // (Figma palette height / Figma photo width at that frame).
      const breakpoints = [
        { width: 375, paletteRatio: 48 / 343 },
        { width: 899, paletteRatio: 56 / 405.5 },
        { width: 1440, paletteRatio: 88 / 668 },
        { width: 1920, paletteRatio: 102 / 788 },
      ];
      for (const { width, paletteRatio } of breakpoints) {
        await page.setViewportSize({ width, height: 1000 });
        // Retry until post-resize layout settles (WebKit can report stale geometry under
        // load); read both rects in one task so nothing shifts between them.
        await expect(async () => {
          const [imageBox, paletteBox] = await block.photo.evaluate((photo) => (
            [photo.querySelector('img'), photo.querySelector('.color-img-accordion-palette')]
              .map((el) => el.getBoundingClientRect().toJSON())
          ));
          expect(Math.abs(imageBox.width / imageBox.height - 16 / 9)).toBeLessThan(0.01);
          expect(Math.abs(paletteBox.height - paletteBox.width * paletteRatio)).toBeLessThan(0.1);
          expect(Math.abs(imageBox.x - paletteBox.x)).toBeLessThan(0.1);
          expect(Math.abs(imageBox.width - paletteBox.width)).toBeLessThan(0.1);
          expect(Math.abs(imageBox.y + imageBox.height - paletteBox.y - 1)).toBeLessThan(0.1);
        }).toPass({ timeout: 5000 });
      }
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

    await test.step('step-3b: Toggle with the keyboard', async () => {
      const second = block.buttons.nth(1);
      await second.focus();
      await page.keyboard.press('Enter');
      await expect(second).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('Space');
      await expect(second).toHaveAttribute('aria-expanded', 'true');
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
