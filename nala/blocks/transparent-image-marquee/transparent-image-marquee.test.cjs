const { test, expect } = require('@playwright/test');
const { features } = require('./transparent-image-marquee.spec.cjs');
const TransparentImageMarqueeBlock = require('./transparent-image-marquee.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('TransparentImageMarqueeBlock Test Suite', () => {
  // Test Id : 0 : @transparent-image-marquee-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new TransparentImageMarqueeBlock(page, features[0].selector);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block and layout render', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.foreground).toBeVisible();
      await expect(block.mainContainer).toBeVisible();
    });

    await test.step('step-3: Verify branding logo and text content', async () => {
      await expect(block.brandingLogo).toBeVisible();
      await expect(block.textContainer).toBeVisible();
      await expect(block.heading).toBeVisible();
      await expect(block.bodyText).toBeVisible();
    });

    await test.step('step-4: Verify the transparent image renders', async () => {
      await expect(block.image).toBeVisible();
    });

    await test.step('step-5: Default variant is dark (no .light class)', async () => {
      await expect(block.block).not.toHaveClass(/\blight\b/);
    });

    await test.step('step-6: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-7: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });

  // Test Id : 1 : @transparent-image-marquee-light
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    const block = new TransparentImageMarqueeBlock(page, features[1].selector);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('step-2: Light variant activates from the authored hex', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.block).toHaveClass(/\blight\b/);
    });

    await test.step('step-3: Light variant has heading and image', async () => {
      await expect(block.heading).toBeVisible();
      await expect(block.image).toBeVisible();
    });
  });

  // Test Id : 2 : @transparent-image-marquee-cta-variations
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    const block = new TransparentImageMarqueeBlock(page, features[2].selector);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    // The CTA-variations page demonstrates several marquee blocks (primary
    // only, two CTAs, with a disclaimer), so assert each variation exists
    // somewhere on the page rather than within a single block.
    const scope = page.locator('.transparent-image-marquee');

    await test.step('step-2: Block and CTA container render', async () => {
      await expect(block.block).toBeVisible();
      await expect(scope.locator('.cta-container').first()).toBeVisible();
    });

    await test.step('step-3: A primary CTA is a visible link', async () => {
      const primary = scope.locator('.cta.primary').first();
      await expect(primary).toBeVisible();
      await expect(primary).toHaveAttribute('href', /.+/);
    });

    await test.step('step-4: A secondary CTA is a visible link', async () => {
      const secondary = scope.locator('.cta.secondary').first();
      await expect(secondary).toBeVisible();
      await expect(secondary).toHaveAttribute('href', /.+/);
    });

    await test.step('step-5: A disclaimer line is present below the CTAs', async () => {
      await expect(scope.locator('.disclaimer').first()).toBeVisible();
    });

    await test.step('step-6: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });
  });
});
