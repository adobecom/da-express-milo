import { expect, test } from '@playwright/test';
import { features } from './typography.spec.cjs';
import Typography from './typography.page.cjs';

let typography;

test.describe('Typography Styles Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    typography = new Typography(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Navigate to typography test page', async () => {
      await typography.gotoURL(testUrl);
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify ul font-size matches p font-size - mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      const comparison = await typography.compareParagraphAndListFontSizes();

      // Skip if no p elements found
      test.skip(comparison.pCount === 0, 'No p elements found on page');

      // Skip if no ul elements found (but log it)
      if (comparison.ulCount === 0) {
        console.warn('No ul elements found on page - skipping ul font-size check');
        test.skip(true, 'No ul elements found');
      }

      expect(comparison.ulMatchesP).toBe(true);
      console.info(`Mobile: p font-size=${comparison.pFontSize}, ul font-size=${comparison.ulFontSize}`);
    });

    await test.step('Verify ul font-size matches p font-size - desktop viewport', async () => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForLoadState('networkidle');

      const comparison = await typography.compareParagraphAndListFontSizes();

      if (comparison.ulCount === 0) {
        console.warn('No ul elements found on page - skipping ul font-size check');
        test.skip(true, 'No ul elements found');
      }

      expect(comparison.ulMatchesP).toBe(true);
      console.info(`Desktop: p font-size=${comparison.pFontSize}, ul font-size=${comparison.ulFontSize}`);
    });

    await test.step('Verify ol font-size matches p font-size - mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      const comparison = await typography.compareParagraphAndListFontSizes();

      // Skip if no ol elements found
      if (comparison.olCount === 0) {
        console.warn('No ol elements found on page - skipping ol font-size check');
        test.skip(true, 'No ol elements found');
      }

      expect(comparison.olMatchesP).toBe(true);
      console.info(`Mobile: p font-size=${comparison.pFontSize}, ol font-size=${comparison.olFontSize}`);
    });

    await test.step('Verify ol font-size matches p font-size - desktop viewport', async () => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForLoadState('networkidle');

      const comparison = await typography.compareParagraphAndListFontSizes();

      if (comparison.olCount === 0) {
        console.warn('No ol elements found on page - skipping ol font-size check');
        test.skip(true, 'No ol elements found');
      }

      expect(comparison.olMatchesP).toBe(true);
      console.info(`Desktop: p font-size=${comparison.pFontSize}, ol font-size=${comparison.olFontSize}`);
    });

    await test.step('Verify all typography styles are consistent', async () => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForLoadState('networkidle');

      const styles = await typography.getAllTypographyStyles();

      if (styles.p && styles.ul) {
        expect(styles.ul.fontSize).toBe(styles.p.fontSize);
        console.info(`✓ ul font-size matches p: ${styles.ul.fontSize}`);
      }

      if (styles.p && styles.ol) {
        expect(styles.ol.fontSize).toBe(styles.p.fontSize);
        console.info(`✓ ol font-size matches p: ${styles.ol.fontSize}`);
      }

      if (styles.p && styles.ul && styles.ol) {
        expect(styles.ul.fontSize).toBe(styles.ol.fontSize);
        console.info(`✓ All typography elements have consistent font-size: ${styles.p.fontSize}`);
      }
    });
  });
});
