/* eslint-disable no-plusplus */
const { expect, test } = require('@playwright/test');
const { features } = require('./grid-marquee.spec.cjs');
const GridMarquee = require('./grid-marquee.page.cjs');

// Use main branch live URL by default, can be overridden via env var
const BASE_URL = process.env.GRID_MARQUEE_BASE_URL || 'https://main--da-express-milo--adobecom.aem.live';

let gridMarquee;

test.describe('grid-marquee test suite', () => {
  test.beforeEach(async ({ page }) => {
    gridMarquee = new GridMarquee(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}, test logo and headline`, async ({ page }) => {
      const testPage = `${BASE_URL}${path}`;
      await gridMarquee.gotoURL(testPage);

      await test.step('validate elements in block', async () => {
        // Wait for the grid-marquee block to be visible first
        await expect(gridMarquee.gridMarquee).toBeVisible({ timeout: 15000 });
        await expect(gridMarquee.expressLogo).toBeVisible();
        await expect(gridMarquee.heading).toBeVisible();
        const heading = await gridMarquee.heading.innerText();
        expect(heading.length).toBeTruthy();
        const paragraphCount = await gridMarquee.headlineText.count();
        for (let i = 0; i < paragraphCount; i++) {
          await expect(gridMarquee.headlineText.nth(i)).toBeVisible();
          const text = await gridMarquee.headlineText.nth(i).innerText();
          expect(text.length).toBeTruthy();
        }
        await expect(gridMarquee.ctas).toBeVisible();
        await expect(gridMarquee.ctaButton.nth(0)).toBeVisible();
      });

      await test.step('ensure only one h1 on page', async () => {
        const allH1s = page.locator('h1');
        const count = await allH1s.count();
        expect(count).toBeLessThan(2);
      });

      await test.step('test cta button clicks', async () => {
        const ctaCount = await gridMarquee.ctaButton.count();
        if (ctaCount > 0) {
          // Verify CTA has href attribute (is a valid link)
          const href = await gridMarquee.ctaButton.nth(0).getAttribute('href');
          expect(href).toBeTruthy();
        }
        if (ctaCount > 1) {
          const href = await gridMarquee.ctaButton.nth(1).getAttribute('href');
          expect(href).toBeTruthy();
        }
      });
    });
  });

  features[1].path.forEach((path) => {
    test(`[Test Id - ${features[1].tcid}] ${features[1].name}, path: ${path}, test cards`, async () => {
      const testPage = `${BASE_URL}${path}`;
      await gridMarquee.gotoURL(testPage);

      let cardCount;
      await test.step('validate elements in block', async () => {
        // Wait for the grid-marquee block to be visible first
        await expect(gridMarquee.gridMarquee).toBeVisible({ timeout: 15000 });
        await expect(gridMarquee.cardsContainer).toBeVisible();
        cardCount = await gridMarquee.card.count();
        expect(cardCount).not.toEqual(0);
      });

      await test.step('validate drawer operations', async () => {
        if (cardCount > 0) {
          // Scroll card into view and wait for it to be visible (handles lazy loading)
          await gridMarquee.card.nth(0).scrollIntoViewIfNeeded();
          await expect(gridMarquee.cardImage.nth(0)).toBeVisible();

          // Hover to reveal drawer
          await gridMarquee.cardImage.nth(0).hover();
          await expect(gridMarquee.cardDrawer.nth(0)).toBeVisible();

          // Verify drawer link exists and has href
          const drawerLinkCount = await gridMarquee.cardDrawerLink.count();
          if (drawerLinkCount > 0) {
            const href = await gridMarquee.cardDrawerLink.nth(0).getAttribute('href');
            expect(href).toBeTruthy();
          }
        }
      });
    });
  });

  features[2].path.forEach((path) => {
    test(`[Test Id - ${features[2].tcid}] ${features[2].name}, path: ${path}, test ratings block`, async () => {
      const testPage = `${BASE_URL}${path}`;
      console.info(`[Test Page]: ${testPage}`);
      await gridMarquee.gotoURL(testPage);

      await test.step('validate elements in block', async () => {
        // Wait for the grid-marquee block to be visible first
        await expect(gridMarquee.gridMarquee).toBeVisible({ timeout: 15000 });
        await expect(gridMarquee.ratings).toBeVisible();
        await expect(gridMarquee.appStoreButton).toBeVisible();
        await expect(gridMarquee.googlePlayButton).toBeVisible();
        const appStoreRating = await gridMarquee.appStoreButton.innerText();
        const googlePlayRating = await gridMarquee.googlePlayButton.innerText();
        expect(appStoreRating).toBeTruthy();
        expect(googlePlayRating).toBeTruthy();
      });

      await test.step('validate button links', async () => {
        // Verify app store links have href attributes
        const appStoreLink = gridMarquee.appStoreButton.locator('a');
        const googlePlayLink = gridMarquee.googlePlayButton.locator('a');

        if (await appStoreLink.count() > 0) {
          const href = await appStoreLink.getAttribute('href');
          expect(href).toBeTruthy();
        }
        if (await googlePlayLink.count() > 0) {
          const href = await googlePlayLink.getAttribute('href');
          expect(href).toBeTruthy();
        }
      });
    });
  });

  features[3].path.forEach((path) => {
    test(`[Test Id - ${features[3].tcid}] ${features[3].name}, path: ${path}, test z-index fix`, async () => {
      const testPage = `${BASE_URL}${path}`;
      await gridMarquee.gotoURL(testPage);

      await test.step('validate z-index values for drawer elements', async () => {
        // Wait for the grid-marquee block to be visible first
        await expect(gridMarquee.gridMarquee).toBeVisible({ timeout: 15000 });
        // Scroll first card into view and hover to reveal drawer
        await gridMarquee.card.nth(0).scrollIntoViewIfNeeded();
        await gridMarquee.cardImage.nth(0).hover();
        await expect(gridMarquee.cardDrawer.nth(0)).toBeVisible();

        // Get the title row and video elements
        const titleRow = gridMarquee.cardDrawer.nth(0).locator('.title-row');
        const video = gridMarquee.cardDrawer.nth(0).locator('video');

        // Check if elements exist and validate z-index
        if (await titleRow.count() > 0 && await video.count() > 0) {
          const titleRowZIndex = await titleRow.evaluate((el) => window.getComputedStyle(el).zIndex);
          const videoZIndex = await video.evaluate((el) => window.getComputedStyle(el).zIndex);

          expect(titleRowZIndex).toBe('2');
          // Video z-index should be 0, but if CSS isn't loaded, it might be 'auto'
          expect(videoZIndex).toMatch(/^(0|auto)$/);
        }
      });

      await test.step('validate z-index hierarchy across all drawers', async () => {
        const cardCount = await gridMarquee.card.count();

        for (let i = 0; i < cardCount; i++) {
          // Scroll card into view and hover to reveal drawer
          await gridMarquee.card.nth(i).scrollIntoViewIfNeeded();
          await gridMarquee.cardImage.nth(i).hover();

          const titleRow = gridMarquee.cardDrawer.nth(i).locator('.title-row');
          const video = gridMarquee.cardDrawer.nth(i).locator('video');

          if (await titleRow.count() > 0 && await video.count() > 0) {
            const titleRowZIndex = await titleRow.evaluate((el) => window.getComputedStyle(el).zIndex);
            const videoZIndex = await video.evaluate((el) => window.getComputedStyle(el).zIndex);

            expect(titleRowZIndex).toBe('2');
            expect(videoZIndex).toBe('0');
          }
        }
      });
    });
  });
});
