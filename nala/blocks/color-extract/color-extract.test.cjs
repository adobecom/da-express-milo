const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./color-extract.spec.cjs');
const ColorExtractBlock = require('./color-extract.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

test.describe('ColorExtractBlock Test Suite', () => {
  // Primary journey (upload-driven) for both variants: palette (0) and gradient (1).
  for (const idx of [0, 1]) {
    // Test Id : 0/1 : upload an image, verify the extract edit stage + variant result.
    test(`[Test Id - ${features[idx].tcid}] ${features[idx].name} ${features[idx].tags}`, async ({ page, baseURL }) => {
      const feature = features[idx];
      const testUrl = `${baseURL}${feature.path}`;
      const block = new ColorExtractBlock(page, feature.selector);
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Navigate to page', async () => {
        await page.goto(testUrl);
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(testUrl);
      });

      await test.step('step-2: Landing stage before upload', async () => {
        await block.waitReady();
        await expect(block.block).toBeVisible();
        await expect(block.landing).toBeVisible();
        await expect(block.dropzone).toBeVisible();
        await expect(block.samples.first()).toBeVisible();
        await expect(block.hero).toHaveCount(0); // refactored out to color-headline
        await expect(block.editStage).toBeHidden();
      });

      await test.step('step-3: Upload image and verify extraction', async () => {
        await block.uploadImage();
        // Layout transition is the visible signal: edit stage in, landing out.
        await expect(block.editStage).toBeVisible({ timeout: 15000 });
        await expect(block.landing).toBeHidden();

        // Extraction outputs (sampled markers + a variant-specific result) are
        // generated in the DOM but render as zero-box chips, so assert by
        // attachment/count rather than visibility.
        // palette -> .ax-swatch, gradient -> .gradient-editor.
        await expect(block.markers.first()).toBeAttached({ timeout: 15000 });
        const result = block.block.locator(feature.result);
        await expect(result.first()).toBeAttached({ timeout: 15000 });
        expect(await result.count()).toBeGreaterThan(0);
      });

      await test.step('step-4: Accessibility validation', async () => {
        await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: true });
      });

      await test.step('step-5: SEO validation', async () => {
        await runSeoChecks({ page, feature, skipSeoTest: false });
      });
    });
  }

  // Secondary entry point: clicking a sample image also reaches the edit stage.
  // Test Id : 2
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const feature = features[2];
    const testUrl = `${baseURL}${feature.path}`;
    const block = new ColorExtractBlock(page, feature.selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Pick a sample image and verify edit stage', async () => {
      await block.waitReady();
      await expect(block.samples.first()).toBeVisible();
      await block.pickSample(0);
      await expect(block.editStage).toBeVisible({ timeout: 15000 });
      await expect(block.landing).toBeHidden();
    });
  });
});
