import { expect, test } from '@playwright/test';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';
import { features } from './pricing-footer.spec.cjs';
import PricingFooter from './pricing-footer.page.cjs';

let pricingFooter;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express pricing-footer block test suite', () => {
  test.beforeEach(async ({ page }) => {
    pricingFooter = new PricingFooter(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const pagePath = features[0].path;
    const isAbsolute = /^https?:\/\//.test(pagePath);
    const testPage = `${isAbsolute ? pagePath : `${baseURL}${pagePath}`}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to pricing footer block test page', async () => {
      await pricingFooter.gotoURL(testPage);
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify pricing footer structure', async () => {
      await page.waitForTimeout(2000);
      console.log(pricingFooter.block);
      await expect(pricingFooter.block).toBeVisible();
      await expect(pricingFooter.block).toHaveClass(/pricing-footer/);
      await expect(pricingFooter.block).toHaveClass(/ax-grid-container/);
      await expect(pricingFooter.block).toHaveClass(/small-gap/);
      const columnCount = await pricingFooter.columns.count();
      expect(columnCount).toBeGreaterThan(0);
      expect(await pricingFooter.countEmptyColumns()).toBe(0);
    });

    await test.step('Verify card count matches merch cards', async () => {
      const merchCardCount = await pricingFooter.getMerchCardCount();
      expect(merchCardCount).toBeGreaterThan(0);
      await expect.poll(async () => pricingFooter.getCardCount()).toBeGreaterThan(0);
      const cardCount = await pricingFooter.getCardCount();
      expect(cardCount).toBe(merchCardCount);
    });

    await test.step('Verify max-width is applied', async () => {
      await expect.poll(async () => pricingFooter.getComputedMaxWidth()).not.toMatch(/^(none|0px)$/);
      const maxWidth = await pricingFooter.getComputedMaxWidth();
      expect(Number.parseFloat(maxWidth)).toBeGreaterThan(0);
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: pricingFooter.block });
    });
  });
});
