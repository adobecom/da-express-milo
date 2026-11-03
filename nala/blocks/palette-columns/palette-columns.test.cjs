const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./palette-columns.spec.cjs');
const PaletteColumnsBlock = require('./palette-columns.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';
const COLOR_COUNT = 5;

async function verifySemantic(block, sem) {
  for (const t of sem.texts) {
    await expect(block.block.locator(t.selector).nth(t.nth || 0)).toContainText(t.text);
  }
  for (const iEl of sem.interactives) {
    const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
    await expect(locator).toBeVisible({ timeout: 8000 });
    if (iEl.type === 'link' && iEl.href) {
      const href = await locator.getAttribute('href');
      const actualPath = new URL(href, 'https://dummy.base').pathname;
      expect(actualPath.endsWith(iEl.href)).toBe(true);
    }
    if (iEl.text) await expect(locator).toContainText(iEl.text);
  }
}

test.describe('PaletteColumnsBlock Test Suite', () => {
  // Test Id : 0 : @palette-columns-right, 1 : @palette-columns-left (desktop)
  for (const idx of [0, 1]) {
    test(`[Test Id - ${features[idx].tcid}] ${features[idx].name} ${features[idx].tags}`, async ({ page, baseURL }) => {
      const feature = features[idx];
      const testUrl = `${baseURL}${feature.path}${miloLibs}`;
      const block = new PaletteColumnsBlock(page, feature.selector);
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Navigate to page', async () => {
        await page.goto(testUrl);
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(testUrl);
        await block.waitReady();
      });

      await test.step('step-2: Verify block content', async () => {
        await expect(block.block).toBeVisible();
        await verifySemantic(block, feature.data.semantic);
        await expect(block.swatches).toHaveAttribute('daa-lh', 'palette-columns');
        await expect(block.editCta).toHaveAttribute('daa-ll', /.+/);
        await expect(block.generateCta).toHaveAttribute('daa-ll', /.+/);
      });

      await test.step('step-3: Verify swatch rail', async () => {
        await expect(block.rail).toHaveAttribute('orientation', 'vertical');
        await expect(block.hexCodes).toHaveCount(COLOR_COUNT);
        await expect(block.copyButtons).toHaveCount(COLOR_COUNT);
        await expect(block.editCta).toHaveAttribute('href', /color-palette=/);
      });

      await test.step('step-4: Verify column order and CTA overlay', async () => {
        const contentBox = await block.content.boundingBox();
        const swatchesBox = await block.swatches.boundingBox();
        const ctasBox = await block.ctas.boundingBox();
        if (feature.layout === 'palette-left') {
          expect(swatchesBox.x).toBeLessThan(contentBox.x);
        } else {
          expect(contentBox.x).toBeLessThan(swatchesBox.x);
        }
        // CTAs sit on top of the rail on desktop/tablet.
        expect(ctasBox.y).toBeGreaterThanOrEqual(swatchesBox.y);
        expect(ctasBox.y + ctasBox.height).toBeLessThanOrEqual(swatchesBox.y + swatchesBox.height);
      });

      await test.step('step-5: Generate random replaces the palette', async () => {
        const beforeHex = await block.hexValues();
        const beforeHref = await block.editCta.getAttribute('href');
        await block.generateCta.click();
        await expect.poll(() => block.hexValues()).not.toEqual(beforeHex);
        await expect(block.hexCodes).toHaveCount(COLOR_COUNT);
        await expect(block.editCta).not.toHaveAttribute('href', beforeHref);
        await expect(block.editCta).toHaveAttribute('href', /color-palette=/);
      });

      await test.step('step-6: Accessibility validation', async () => {
        await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
      });

      await test.step('step-7: SEO validation', async () => {
        await runSeoChecks({ page, feature, skipSeoTest: false });
      });
    });
  }

  // Test Id : 2 : @palette-columns-mobile
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const feature = features[2];
    const testUrl = `${baseURL}${feature.path}${miloLibs}`;
    const block = new PaletteColumnsBlock(page, feature.selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page on a mobile viewport', async () => {
      await page.setViewportSize(feature.viewport);
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
      await block.waitReady();
    });

    await test.step('step-2: Content, rail and CTAs stack in order', async () => {
      await expect(block.rail).toHaveAttribute('orientation', 'stacked');
      await expect(block.hexCodes).toHaveCount(COLOR_COUNT);
      await block.block.scrollIntoViewIfNeeded();

      const contentBox = await block.content.boundingBox();
      const railBox = await block.block.locator('.palette-columns-rail').boundingBox();
      const ctasBox = await block.ctas.boundingBox();
      expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(railBox.y);
      // CTAs flow below the rail on mobile instead of overlaying it.
      expect(railBox.y + railBox.height).toBeLessThanOrEqual(ctasBox.y);
      await expect(block.editCta).toBeVisible();
      await expect(block.generateCta).toBeVisible();
    });
  });
});
