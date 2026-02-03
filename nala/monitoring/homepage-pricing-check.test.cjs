const { test, expect } = require('@playwright/test');

/**
 * Page: https://www.adobe.com/express/?martech=off
 * Purpose: Assert the pricing fields in Pricing Cards have valid values.
 */

const BASE_URL = 'https://www.adobe.com/express';
const URL_PATH = '?georouting=off&martech=off';
const LOCALES = ['br', 'fr', 'jp', 'uk', 'us'];

test.describe('Pricing Check Synthetic Monitoring', () => {
  for (const locale of LOCALES) {
    test(`[Test Id - ${locale}] @pricing-check @monitoring @${locale} @express`, async ({ page, browserName }) => {
      // Skip on Chromium and WebKit due to HTTP/2 protocol errors with production URLs
      test.skip(
        browserName === 'chromium' || browserName === 'webkit',
        'Monitoring tests only run on Firefox to avoid bot detection issues',
      );
      // Construct the URL based on locale
      // Correct format: https://www.adobe.com/{locale}/express/ (not /express/{locale}/)
      let pageUrl;
      if (locale === 'us') {
        pageUrl = `${BASE_URL}${URL_PATH}`;
      } else {
        pageUrl = `https://www.adobe.com/${locale}/express/${URL_PATH}`;
      }

      await test.step('Navigate to the page', async () => {
        await page.goto(pageUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
      });

      await test.step('Wait for Milo page load indicator', async () => {
        // Wait for the hidden page-load-ok-milo element to be found in the DOM
        const pageLoadIndicator = page.locator('#page-load-ok-milo');
        await expect(pageLoadIndicator).toBeAttached({ timeout: 30000 });
      });

      await test.step('Validate pricing fields are not undefined', async () => {
        // Find all price elements
        const priceElements = page.locator('.pricing-price');
        const count = await priceElements.count();

        // Ensure at least some price elements exist
        expect(count).toBeGreaterThan(0);

        // Check each price field
        for (let i = 0; i < count; i++) {
          const element = priceElements.nth(i);
          const innerText = await element.innerText();

          // Assert that the value is not "undefined"
          expect(innerText).not.toBe('undefined');

          // Additional validation: ensure the text is not empty
          expect(innerText.trim()).not.toBe('');
        }
      });
    });
  }
});
