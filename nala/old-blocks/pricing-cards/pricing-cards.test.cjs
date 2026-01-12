/* eslint-disable no-plusplus */
import { expect, test } from '@playwright/test';
import { features } from './pricing-cards.spec.cjs';
import PricingCards from './pricing-cards.page.cjs';

let pc;

test.describe('pricing-cards test suite', () => {
  test.beforeEach(async ({ page }) => {
    pc = new PricingCards(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}`, async ({ baseURL }) => {
      const url = `${baseURL}${path}`;
      await pc.gotoURL(url);
      await pc.scrollToPricingCards();

      await test.step('fail if block reports data-failed="true"', async () => {
        const failed = await pc.block.first().getAttribute('data-failed');
        expect(failed).not.toBe('true');
      });

      await test.step('validate structure', async () => {
        await expect(pc.block).toBeVisible();
        const count = await pc.card.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
          await expect(pc.card.nth(i)).toBeVisible();
          await expect(pc.cardHeader.nth(i)).toBeVisible();
          await expect(pc.sectionMonthly.nth(i)).not.toHaveClass(/hide/);
          await expect(pc.sectionAnnually.nth(i)).toHaveClass(/hide/);
          await expect(pc.card.nth(i).locator('.pricing-section:not(.hide)')).toHaveCount(1);
        }
      });

      await test.step('toggle monthly/annually', async () => {
        const n = await pc.card.count();
        for (let i = 0; i < n; i++) {
          const cardRoot = pc.card.nth(i);
          const toggleGroup = cardRoot.locator('.billing-toggle');
          const hasToggle = (await toggleGroup.count()) > 0;
          if (!hasToggle) {
            // no toggle for this card; skip assertions for toggling
            // but still ensure only one section is visible by default
            await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);
            // eslint-disable-next-line no-continue
            continue; // allowed due to preceding comment and focused scope
          }
          const isToggleVisible = await toggleGroup.first().isVisible();
          if (!isToggleVisible) {
            await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);
            // eslint-disable-next-line no-continue
            continue;
          }
          const toggleClass = await toggleGroup.first().getAttribute('class');
          const isSuppressed = !!(toggleClass && toggleClass.includes('suppressed-billing-toggle'));
          if (isSuppressed) {
            await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);
            // eslint-disable-next-line no-continue
            continue;
          }

          const toggles = toggleGroup.locator('[role="radio"]');
          const tCount = await toggles.count();
          if (tCount === 0) {
            await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);
            // eslint-disable-next-line no-continue
            continue;
          }

          const monthlyBtn = toggles.nth(0);
          const annualBtn = tCount > 1 ? toggles.nth(1) : toggles.nth(0);
          const isAnnualVisible = await annualBtn.isVisible();
          if (!isAnnualVisible) {
            await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);
            // eslint-disable-next-line no-continue
            continue;
          }

          await annualBtn.click();
          await expect(cardRoot.locator('.pricing-section.annually')).not.toHaveClass(/hide/);
          await expect(cardRoot.locator('.pricing-section.monthly')).toHaveClass(/hide/);
          await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);

          await monthlyBtn.click();
          await expect(cardRoot.locator('.pricing-section.monthly')).not.toHaveClass(/hide/);
          await expect(cardRoot.locator('.pricing-section.annually')).toHaveClass(/hide/);
          await expect(cardRoot.locator('.pricing-section:not(.hide)')).toHaveCount(1);

          await expect(monthlyBtn).toHaveAttribute('aria-checked', 'true');
        }
      });

      await test.step('prices and CTAs', async () => {
        const n = await pc.card.count();
        for (let i = 0; i < n; i++) {
          const priceText = await pc.card.nth(i).locator('.pricing-price > strong').first().textContent();
          expect((priceText || '').trim().length).toBeTruthy();

          const ctas = pc.card.nth(i).locator('.card-cta-group a');
          const ctaCount = await ctas.count();
          expect(ctaCount).toBeGreaterThan(0);
        }
      });

      await test.step('tooltip parsing on second card', async () => {
        const cardIndex = 1; // second card
        const premiumCard = pc.card.nth(cardIndex);
        await expect(premiumCard).toBeVisible();
        const monthlySection = premiumCard.locator('.pricing-section.monthly');
        await expect(monthlySection).not.toHaveClass(/hide/);

        const tooltipPara = monthlySection.locator('p.tooltip');
        const tooltipCount = await tooltipPara.count();
        expect(tooltipCount).toBeGreaterThan(0);

        const tooltipButton = tooltipPara.first().locator('button');
        await expect(tooltipButton).toBeVisible();
        await expect(tooltipButton.locator('.tooltip-icon')).toBeVisible();

        const tooltipText = tooltipButton.locator('.tooltip-text');
        await expect(tooltipText).toHaveCount(1);
        const ttTextRaw = await tooltipText.innerText();
        const ttText = (ttTextRaw || '').replace(/\s+/g, ' ').trim();
        expect(ttText.length).toBeTruthy();
      });

      await test.step('compare link (optional)', async () => {
        if (await pc.compareLink.count()) {
          await expect(pc.compareLink.first()).toBeVisible();
        }
      });
    });
  });
});
