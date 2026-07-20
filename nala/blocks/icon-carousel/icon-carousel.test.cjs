const { test, expect } = require('@playwright/test');
const { features } = require('./icon-carousel.spec.cjs');
const IconCarouselBlock = require('./icon-carousel.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('IconCarouselBlock Test Suite', () => {
  // Test Id : 0 : @icon-carousel-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new IconCarouselBlock(page, features[0].selector);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block renders', async () => {
      await expect(block.block).toBeVisible();
    });

    await test.step('step-3: Verify header section', async () => {
      await expect(block.header).toBeVisible();
      await expect(block.heading).toBeVisible();
      await expect(block.subtitle).toBeVisible();
    });

    await test.step('step-4: Verify gallery and cards', async () => {
      await expect(block.gallery).toBeVisible();
      await expect(block.firstCard).toBeVisible();
      await expect(block.cardTitles.first()).toBeVisible();
      await expect(block.cardBodies.first()).toBeVisible();
    });

    await test.step('step-4b: Gallery carousel group has an accessible name', async () => {
      await expect(block.gallery).toHaveAttribute('role', 'group');
      const label = await block.gallery.getAttribute('aria-label');
      expect(label && label.trim().length).toBeTruthy();
    });

    await test.step('step-5: Verify card icons are present', async () => {
      await expect(block.cardIcons.first()).toBeVisible();
    });

    await test.step('step-6: Verify nav controls are present', async () => {
      await expect(block.controls).toBeVisible();
      await expect(block.prevBtn).toBeVisible();
      await expect(block.nextBtn).toBeVisible();
    });

    await test.step('step-7: Prev button is disabled on first card', async () => {
      await expect(block.prevBtn).toBeDisabled();
    });

    await test.step('step-8: Next button advances the carousel', async () => {
      const isDisabled = await block.nextBtn.isDisabled();
      if (!isDisabled) {
        await block.nextBtn.click();
        await expect(block.nextBtn).not.toBeDisabled();
      }
    });

    await test.step('step-9: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-10: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });

  // Test Id : 1 : @icon-carousel-dark
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    const block = new IconCarouselBlock(page, features[1].selector);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('step-2: Dark variant block is visible', async () => {
      await expect(block.block).toBeVisible();
    });

    await test.step('step-3: Dark variant has heading and cards', async () => {
      await expect(block.heading).toBeVisible();
      await expect(block.firstCard).toBeVisible();
    });

    await test.step('step-4: Nav buttons are visible in dark mode', async () => {
      await expect(block.prevBtn).toBeVisible();
      await expect(block.nextBtn).toBeVisible();
    });
  });

  // Test Id : 2 : @icon-carousel-widescreen
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    const block = new IconCarouselBlock(page, features[2].selector);
    const { leftBuffer } = features[2].data;

    await test.step('step-1: Navigate at a widescreen viewport', async () => {
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('step-2: Block and gallery are visible', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.gallery).toBeVisible();
    });

    await test.step(`step-3: Content is inset ${leftBuffer} from the left`, async () => {
      await expect(block.block).toHaveCSS('padding-left', leftBuffer);
      await expect(block.gallery).toHaveCSS('padding-left', leftBuffer);
    });
  });
});
