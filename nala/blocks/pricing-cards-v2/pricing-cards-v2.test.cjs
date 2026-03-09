/* eslint-disable no-plusplus */
import { expect, test } from '@playwright/test';
import { features } from './pricing-cards-v2.spec.cjs';
import PricingCardsV2 from './pricing-cards-v2.page.cjs';

let pcv2;

test.describe('pricing-cards-v2 test suite', () => {
  test.beforeEach(async ({ page }) => {
    pcv2 = new PricingCardsV2(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}`, async ({ baseURL }) => {
      const url = `${baseURL}${path}`;
      await pcv2.gotoURL(url);
      await pcv2.scrollToBlock();
      const isMobile = /mobile/i.test(test.info().project.name || '');

      await test.step('fail if block reports data-failed="true"', async () => {
        const failed = await pcv2.block.first().getAttribute('data-failed');
        expect(failed).not.toBe('true');
      });

      await test.step('validate structure', async () => {
        await expect(pcv2.block).toBeVisible();
        const count = await pcv2.card.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
          await expect(pcv2.card.nth(i)).toBeVisible();
          await expect(pcv2.cardHeader.nth(i)).toBeVisible();
          if (!isMobile) {
            await expect(pcv2.pricingArea.nth(i)).toBeVisible();
            await expect(pcv2.pricingRow.nth(i)).toBeVisible();
            await expect(pcv2.pricingPrice.nth(i)).toBeVisible();
            await expect(pcv2.ctas.nth(i)).toBeVisible();
          }
        }
      });

      await test.step('compare link (optional)', async () => {
        if (await pcv2.compareLink.count()) {
          await expect(pcv2.compareLink.first()).toBeVisible();
        }
      });
    });
  });
});
