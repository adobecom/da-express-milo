const { test, expect } = require('@playwright/test');
const { features } = require('./font-generator.spec.cjs');
const FontGeneratorBlock = require('./font-generator.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('FontGeneratorBlock Test Suite', () => {
  // Test Id : 0 : @font-generator-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new FontGeneratorBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block structure', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.grid).toBeVisible();
      await expect(block.sideCol).toBeVisible();
      await expect(block.mainCol).toBeVisible();
    });

    await test.step('step-3: Verify side panel renders', async () => {
      await expect(block.sidePanel).toBeVisible();
      await expect(block.textarea).toBeVisible();
    });

    await test.step('step-4: Verify toolbar renders', async () => {
      await expect(block.toolbar).toBeVisible();
      await expect(block.filterTrigger).toBeVisible();
    });

    await test.step('step-5: Verify font card grid renders', async () => {
      await expect(block.fontCardGrid).toBeVisible();
      await expect(block.fontCards.first()).toBeVisible();
    });

    await test.step('step-6: Filter trigger opens the filter panel', async () => {
      await block.filterTrigger.click();
      await expect(block.filterPanel).toBeVisible();
    });

    await test.step('step-7: Filter panel close button closes the panel', async () => {
      await block.filterPanelClose.click();
      await expect(block.filterPanel).not.toBeVisible();
    });

    await test.step('step-8: Typing in textarea updates font card previews', async () => {
      await block.textarea.fill('Hello world');
      const firstCard = block.fontCards.first();
      await expect(firstCard.locator('.font-card-preview')).toContainText('Hello world');
    });

    await test.step('step-9: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-10: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
