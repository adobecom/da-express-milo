const { test, expect } = require('@playwright/test');
const { features } = require('./discovery-table.spec.cjs');
const DiscoveryTableBlock = require('./discovery-table.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('DiscoveryTableBlock Test Suite', () => {
  // Test Id : 0 : @discovery-table-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new DiscoveryTableBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    const isMobile = /mobile/i.test(test.info().project.name || '');

    await test.step('step-2: Verify block structure', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.sectionHeader).toBeVisible();
      await expect(block.headerText).toBeVisible();
      await expect(block.tableContainer).toBeVisible();
      await expect(block.table).toBeVisible();
    });

    await test.step('step-3: Verify table has column headers and data rows', async () => {
      await expect(block.dataColHeaders.first()).toBeVisible();
      await expect(block.labelColCells.first()).toBeVisible();
      await expect(block.dataBodyCells.first()).toBeVisible();
    });

    await test.step('step-4: Verify carousel nav buttons', async () => {
      if (isMobile) {
        await expect(block.carouselNav).toBeVisible();
        await expect(block.prevBtn).toBeVisible();
        await expect(block.nextBtn).toBeVisible();
        await expect(block.prevBtn).toBeDisabled();
        await expect(block.nextBtn).toBeEnabled();
      } else {
        await expect(block.carouselNav).not.toBeVisible();
      }
    });

    await test.step('step-5: Verify next button advances and prev becomes enabled', async () => {
      if (isMobile) {
        await block.nextBtn.click();
        await expect(block.prevBtn).toBeEnabled();
      }
    });

    await test.step('step-6: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-7: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
