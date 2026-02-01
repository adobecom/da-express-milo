const { test, expect } = require('@playwright/test');

/**
 * Page: Adobe Express Frictionless QA - Convert MP4 page
 * Purpose: Validates all blocks render on the page and checks dropzone + upload button functionality
 * Converted from New Relic Selenium synthetic monitoring script
 */

const PAGE_URL = 'https://www.adobe.com/express/feature/video/convert/mp4';

test.describe('MP4 Converter Check Monitoring', () => {
  test('[Test Id - mp4-converter] @mp4-converter-check @monitoring @express', async ({ page, browserName }) => {
    // Skip on Chromium and WebKit due to HTTP/2 protocol errors with production URLs
    test.skip(
      browserName === 'chromium' || browserName === 'webkit',
      'Monitoring tests only run on Firefox to avoid bot detection issues',
    );

    console.log(`Navigating to ${PAGE_URL}...`);

    await test.step('Navigate to the page', async () => {
      await page.goto(PAGE_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      console.log('Page loaded successfully');
    });

    await test.step('Wait for Milo page load indicator', async () => {
      // Wait for the hidden page-load-ok-milo element to be found in the DOM
      const pageLoadIndicator = page.locator('#page-load-ok-milo');
      await expect(pageLoadIndicator).toBeAttached({ timeout: 30000 });
      console.log('Milo page load indicator found');

      // Verify element is hidden (not displayed)
      const isVisible = await pageLoadIndicator.isVisible();
      console.log(`Element found. Displayed: ${isVisible}`);
      expect(isVisible).toBe(false);
    });

    await test.step('Validate dropzone is visible', async () => {
      const dropzone = page.locator('.dropzone');
      await expect(dropzone).toBeVisible({ timeout: 10000 });
      console.log('Dropzone is visible');
    });

    await test.step('Validate upload button is enabled', async () => {
      const uploadButton = page.locator('.dropzone a[title="Upload your video"]');
      await expect(uploadButton).toBeVisible({ timeout: 5000 });
      await expect(uploadButton).toBeEnabled({ timeout: 5000 });
      console.log('Upload button is visible and enabled');
    });

    console.log(`Successfully completed test for: ${PAGE_URL}`);
  });
});
