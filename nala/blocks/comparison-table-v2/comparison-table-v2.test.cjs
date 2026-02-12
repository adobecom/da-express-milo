const { test, expect } = require('@playwright/test');
const { features } = require('./comparison-table-v2.spec.cjs');
const ComparisonTableV2Block = require('./comparison-table-v2.page.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Comparison Table V2 Block Test Suite', () => {
  features.forEach((feature) => {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({ page, baseURL }) => {
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

      await test.step('Verify accordion containers initialize correctly', async () => {
        await expect(block.block).toBeVisible();
        const containerCount = await block.accordionContainers.count();
        expect(containerCount).toBeGreaterThan(1);
        await expect(block.tableAt(0)).not.toHaveClass(/hide-table/);
        await expect(block.tableAt(1)).toHaveClass(/hide-table/);
      });

      await test.step('Toggle a collapsed section and ensure previous one closes', async () => {
        await block.toggleAt(1).click();
        await page.waitForTimeout(500);
        await expect(block.tableAt(1)).not.toHaveClass(/hide-table/);
        await expect(block.tableAt(0)).toHaveClass(/hide-table/);
      });
    });
  });
});
