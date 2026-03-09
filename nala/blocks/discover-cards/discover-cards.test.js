/* eslint-disable no-plusplus */
import { expect, test } from '@playwright/test';
import { features } from './discover-cards.spec.js';
import DiscoverCard from './discover-cards.page.js';

let discoverCard;

test.describe('Discover cards test suite', () => {
  test.beforeEach(async ({ page }) => {
    discoverCard = new DiscoverCard(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}`, async ({ baseURL, page }) => {
      const testPage = `${baseURL}${path}`;
      await discoverCard.gotoURL(testPage);

      await test.step('Validate cards UI', async () => {
        await discoverCard.scrollToDiscoverCards();
        await expect(discoverCard.cardsBlock).toBeVisible();

        const noOfCards = await discoverCard.card.count();
        expect(noOfCards).toBeGreaterThan(0);

        await expect(discoverCard.cardTitle.nth(0)).toBeVisible();
        const title = await discoverCard.cardTitle.nth(0).innerText();
        expect(title.length).toBeTruthy();
        await expect(discoverCard.cardImage.nth(0)).toBeVisible();
        const text = await discoverCard.cardText.nth(0).innerText();
        expect(text.length).toBeTruthy();
        await expect(discoverCard.cardButton.nth(0)).toBeEnabled();
      });

      await test.step('Validate card button click', async () => {
        if (path === '/express/') {
          await discoverCard.clickButtonOfFirstCard();
          expect(page.url).not.toBe(testPage);
        } else {
          await page.waitForLoadState('networkidle');
          const [newTab] = await Promise.all([
            page.waitForEvent('popup'),
            await discoverCard.clickButtonOfFirstCard(),
          ]);
          expect(newTab.url).not.toBe(testPage);
          await newTab.close();
        }
        await discoverCard.gotoURL(testPage);
      });
    });
  });
});
