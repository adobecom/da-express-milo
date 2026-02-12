const { test, expect } = require('@playwright/test');
const { features } = require('./comparison-table-v2.spec.cjs');
const ComparisonTableV2Block = require('./comparison-table-v2.page.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Comparison Table V2 Block Test Suite', () => {
  features.forEach((feature) => {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({ page, baseURL }) => {
      const isAccordionVariant = feature.tags.includes('@accordion');
      const pagePath = feature.path;
      const isAbsolute = /^https?:\/\//.test(pagePath);
      const testUrl = `${isAbsolute ? pagePath : `${baseURL}${pagePath}`}${miloLibs}`;
      const block = new ComparisonTableV2Block(page, feature.selector);
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('Navigate to comparison table block example', async () => {
        await page.goto(testUrl);
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(testUrl);
      });

      const containerCount = await block.accordionContainers.count();

      await test.step('Verify block structure and table initialization', async () => {
        await expect(block.block).toBeVisible();
        expect(containerCount).toBeGreaterThan(1);
        const stickyHeader = block.block.locator('.sticky-header');
        await expect(stickyHeader).toBeVisible();
        const planSelectorCount = await block.block.locator('.plan-selector').count();
        expect(planSelectorCount).toBeGreaterThan(0);
        await expect(block.tableAt(0)).not.toHaveClass(/hide-table/);
        if (containerCount > 1) {
          await expect(block.tableAt(1)).toHaveClass(/hide-table/);
        }
      });

      if (isAccordionVariant) {
        await test.step('Toggle a collapsed section and ensure previous one closes', async () => {
          await block.toggleAt(1).click();
          await page.waitForTimeout(500);
          await expect(block.tableAt(1)).not.toHaveClass(/hide-table/);
          await expect(block.tableAt(0)).toHaveClass(/hide-table/);
        });
      } else {
        await test.step('Toggle multiple sections independently in default variant', async () => {
          expect(containerCount).toBeGreaterThan(2);
          await block.toggleAt(1).click();
          await page.waitForTimeout(500);
          await block.toggleAt(2).click();
          await page.waitForTimeout(500);
          await expect(block.tableAt(0)).not.toHaveClass(/hide-table/);
          await expect(block.tableAt(1)).not.toHaveClass(/hide-table/);
          await expect(block.tableAt(2)).not.toHaveClass(/hide-table/);
        });
      }
    });
  });
});
