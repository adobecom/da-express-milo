/* eslint-disable no-plusplus */
import { expect, test } from '@playwright/test';
import { features } from './simplified-pricing-cards-v2.spec.cjs';
import SimplifiedPricingCardsV2 from './simplified-pricing-cards-v2.page.cjs';

let spcv2;

test.describe('simplified-pricing-cards-v2 test suite', () => {
  test.beforeEach(async ({ page }) => {
    spcv2 = new SimplifiedPricingCardsV2(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}`, async ({ baseURL }) => {
      const url = `${baseURL}${path}`;
      await spcv2.gotoURL(url);
      await spcv2.scrollToBlock();
      const isMobile = /mobile/i.test(test.info().project.name || '');

      await test.step('fail if block reports data-failed="true"', async () => {
        const failed = await spcv2.block.first().getAttribute('data-failed');
        expect(failed).not.toBe('true');
      });

      await test.step('validate structure', async () => {
        await expect(spcv2.block).toBeVisible();
        const count = await spcv2.card.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
          await expect(spcv2.card.nth(i)).toBeVisible();
          await expect(spcv2.cardHeader.nth(i)).toBeVisible();
          if (!isMobile) {
            await expect(spcv2.pricingArea.nth(i)).toBeVisible();
            await expect(spcv2.pricingRow.nth(i)).toBeVisible();
            await expect(spcv2.pricingPrice.nth(i)).toBeVisible();
            await expect(spcv2.ctas.nth(i)).toBeVisible();
          }
        }
      });

      if (isMobile) {
        await test.step('accordion default states (mobile only)', async () => {
          const count = await spcv2.card.count();
          expect(count).toBeGreaterThan(0);
          // Third card expanded by default per snippet
          await expect(spcv2.card.nth(2).locator('.card-inner-content')).not.toHaveClass(/hide/);
          // First two cards collapsed
          await expect(spcv2.card.nth(0).locator('.card-inner-content')).toHaveClass(/hide/);
          await expect(spcv2.card.nth(1).locator('.card-inner-content')).toHaveClass(/hide/);
        });
      }

      if (isMobile) {
        await test.step('toggle accordion on first two cards (mobile only)', async () => {
          for (let i = 0; i < 2; i++) {
            const headerBtn = spcv2.headerToggleButton.nth(i);
            await expect(headerBtn).toBeVisible();
            await headerBtn.click();
            await expect(spcv2.card.nth(i).locator('.card-inner-content')).not.toHaveClass(/hide/);
            // Collapse back
            await headerBtn.click();
            await expect(spcv2.card.nth(i).locator('.card-inner-content')).toHaveClass(/hide/);
          }
        });
      }

      await test.step('tooltip parsing on second card (text tooltip)', async () => {
        const cardIndex = 1; // second card
        const card = spcv2.card.nth(cardIndex);
        await expect(card).toBeVisible();
        // Ensure expanded to access content (mobile only)
        if (/mobile/i.test(test.info().project.name || '')) {
          const toggle = spcv2.headerToggleButton.nth(cardIndex);
          await toggle.click();
        }
        const tooltipPara = card.locator('p.tooltip');
        const tooltipCount = await tooltipPara.count();
        if (tooltipCount > 0) {
          const tooltipButton = tooltipPara.first().locator('button');
          await expect(tooltipButton).toBeVisible();
          await expect(tooltipButton.locator('.tooltip-icon')).toBeVisible();
          const tooltipText = tooltipButton.locator('.tooltip-text');
          await expect(tooltipText).toHaveCount(1);
          const ttTextRaw = await tooltipText.innerText();
          const ttText = (ttTextRaw || '').replace(/\s+/g, ' ').trim();
          expect(ttText.length).toBeTruthy();
        }
      });

      await test.step('image tooltips render text on hover (desktop only)', async () => {
        const cardIndex = 2; // third card (expanded)
        const card = spcv2.card.nth(cardIndex);
        await expect(card).toBeVisible();
        const pics = card.locator('.image-tooltip button');
        const t = await pics.count();
        expect(t).toBeGreaterThan(0);
        // Hover first image tooltip and assert tooltip text visible/non-empty
        const firstTooltip = pics.first();
        await firstTooltip.hover();
        const firstTooltipText = firstTooltip.locator('.tooltip-text');
        await expect(firstTooltipText).toBeVisible();
        const textRaw = await firstTooltipText.innerText();
        const text = (textRaw || '').replace(/\s+/g, ' ').trim();
        expect(text.length).toBeTruthy();
      });
    });
  });
});
