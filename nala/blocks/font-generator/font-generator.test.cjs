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
      await expect(block.container).toBeVisible();
      await expect(block.sidebar).toBeVisible();
      await expect(block.main).toBeVisible();
    });

    await test.step('step-3: Verify filter list renders', async () => {
      await expect(block.sidebarFilters).toBeVisible();
      await expect(block.filterList).toBeVisible();
      await expect(block.allFilterBtn).toBeVisible();
      await expect(block.categoryButtons.first()).toBeVisible();
    });

    await test.step('step-4: Verify accordion label', async () => {
      const label = await block.accordionItem.getAttribute('label');
      expect(label).toBe('Categories');
    });

    await test.step('step-5: Verify "All" button is selected by default', async () => {
      await expect(block.allFilterBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(block.allFilterBtn).toHaveAttribute('tabindex', '0');
      await expect(block.allFilterBtn).toHaveClass(/is-selected/);

      const catCount = await block.categoryButtons.count();
      for (let i = 0; i < catCount; i += 1) {
        await expect(block.categoryButtons.nth(i)).toHaveAttribute('aria-pressed', 'false');
        await expect(block.categoryButtons.nth(i)).toHaveAttribute('tabindex', '-1');
      }
    });

    await test.step('step-6: Clicking a category button selects it and deselects "All"', async () => {
      const firstCat = block.categoryButtons.first();
      await firstCat.click();

      await expect(firstCat).toHaveAttribute('aria-pressed', 'true');
      await expect(firstCat).toHaveAttribute('tabindex', '0');
      await expect(firstCat).toHaveClass(/is-selected/);
      await expect(block.allFilterBtn).toHaveAttribute('aria-pressed', 'false');
      await expect(block.allFilterBtn).toHaveAttribute('tabindex', '-1');
    });

    await test.step('step-7: Clicking the same category button again restores "All"', async () => {
      const firstCat = block.categoryButtons.first();
      await firstCat.click();

      await expect(block.allFilterBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(block.allFilterBtn).toHaveAttribute('tabindex', '0');
      await expect(block.allFilterBtn).toHaveClass(/is-selected/);
      await expect(firstCat).toHaveAttribute('aria-pressed', 'false');
    });

    await test.step('step-8: Arrow key navigation moves focus between filter buttons', async () => {
      await block.allFilterBtn.focus();
      await page.keyboard.press('ArrowRight');

      const firstCat = block.categoryButtons.first();
      await expect(firstCat).toHaveAttribute('tabindex', '0');
      await expect(block.allFilterBtn).toHaveAttribute('tabindex', '-1');

      await page.keyboard.press('ArrowLeft');
      await expect(block.allFilterBtn).toHaveAttribute('tabindex', '0');
    });

    await test.step('step-9: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-10: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
