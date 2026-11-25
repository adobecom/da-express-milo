const { test, expect } = require('@playwright/test');

/**
 * Page: https://www.adobe.com/express/pricing?martech=off
 * Purpose: Wait for visible merch-card or legacy pricing fields to render valid values.
 */

const BASE_URL = 'https://www.adobe.com';
const URL_PATH = 'express/pricing?georouting=off&martech=off';
const LOCALES = ['br', 'fr', 'jp', 'uk', 'us'];

test.describe('Pricing Page Check Synthetic Monitoring', () => {
  for (const locale of LOCALES) {
    test(`[Test Id - ${locale}] @pricing-page-check @monitoring @${locale} @express`, async ({ page, browserName }) => {
      // Skip on Chromium and WebKit due to HTTP/2 protocol errors with production URLs
      test.skip(
        browserName === 'chromium' || browserName === 'webkit',
        'Monitoring tests only run on Firefox to avoid bot detection issues',
      );
      // Construct the URL based on locale
      // Correct format: https://www.adobe.com/{locale}/express/pricing
      let pageUrl;
      if (locale === 'us') {
        pageUrl = `${BASE_URL}/${URL_PATH}`;
      } else {
        pageUrl = `${BASE_URL}/${locale}/${URL_PATH}`;
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

      await test.step('Wait for pricing to render and validate values', async () => {
        // Check placeholders in displayed cards, not hidden alternate offers.
        const priceElements = page.locator('merch-card:visible [is="inline-price"][data-template="price"], .pricing-price');
        await expect(priceElements.first()).toBeAttached({ timeout: 30000 });
        const count = await priceElements.count();

        for (let i = 0; i < count; i++) {
          const element = priceElements.nth(i);
          await expect(element).toHaveText(/\d/, { timeout: 30000 });
          await expect(element).not.toContainText(/undefined/i);
        }
      });
    });
  }
});
