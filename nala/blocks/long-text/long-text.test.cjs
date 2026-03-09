import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './long-text.spec.cjs';
import LongText from './long-text.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let longText;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Long Text Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    longText = new LongText(page);
  });

  // Single comprehensive test with all variants
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    // const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to long-text block test page', async () => {
      await longText.gotoURL(testUrl);
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Wait for page to load and verify content', async () => {
      await longText.waitForContent();

      // Check if long-text elements exist, if not, wait a bit more
      const longTextCount = await longText.longText.count();
      if (longTextCount === 0) {
        console.log('No long-text elements found, waiting for JavaScript to process...');
        await page.waitForTimeout(2000);
      }
      await expect(longText.longText.first()).toBeVisible();

      // Verify basic structure
      const structure = await longText.getContentStructure();
      console.log('Content structure:', JSON.stringify(structure, null, 2));

      expect(structure.h2Count).toBeGreaterThanOrEqual(1);
      expect(structure.pCount).toBeGreaterThanOrEqual(1);
    });

    await test.step('Verify plain variant functionality', async () => {
      const plainExists = await longText.variants.plain.count() > 0;
      if (plainExists) {
        await expect(longText.variants.plain).toBeVisible();

        // Verify plain variant has wrapper class
        const plainWrapper = longText.variants.plain.locator('xpath=..');
        await expect(plainWrapper).toHaveClass(/plain/);

        // Verify plain variant doesn't have article structure
        const plainArticles = longText.variants.plain.locator('article');
        const articleCount = await plainArticles.count();
        expect(articleCount).toBe(0);
      }
    });

    await test.step('Verify no-background variant functionality', async () => {
      const noBackgroundExists = await longText.variants.noBackground.count() > 0;
      if (noBackgroundExists) {
        // Check each no-background variant individually to avoid strict mode violation
        const noBackgroundCount = await longText.variants.noBackground.count();
        for (let i = 0; i < noBackgroundCount; i++) {
          await expect(longText.variants.noBackground.nth(i)).toBeVisible();
        }

        // Verify no-background variant has wrapper class
        const noBackgroundWrapper = longText.variants.noBackground.first().locator('xpath=..');
        await expect(noBackgroundWrapper).toHaveClass(/no-background/);

        // Verify no-background variant has article structure
        const noBackgroundStructure = await longText.getNoBackgroundStructure();
        expect(noBackgroundStructure.hasSemanticStructure).toBe(true);
        expect(noBackgroundStructure.articleCount).toBeGreaterThanOrEqual(1);

        // Verify articles contain heading and paragraph
        for (const article of noBackgroundStructure.articles) {
          const hasHeading = article.hasH2 || article.hasH3 || article.hasH4;
          expect(hasHeading).toBe(true);
          expect(article.hasP).toBe(true);
        }
      }
    });

    await test.step('Verify design tokens are applied', async () => {
      const tokens = LongText.getDesignTokens();

      // Verify h2 styling
      expect(tokens.h2Color).toBeTruthy();
      expect(tokens.h2FontSize).toBeTruthy();

      // Verify p styling
      expect(tokens.pColor).toBeTruthy();
      expect(tokens.pFontSize).toBeTruthy();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(longText.longText.first()).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('long-text', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: longText.longText.first() });
    });

    await test.step('Test responsive behavior - mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await longText.waitForContent();
      const structure = await longText.getContentStructure();
      expect(structure.h2Count).toBeGreaterThanOrEqual(1);
    });

    await test.step('Test responsive behavior - tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await longText.waitForContent();
      const structure = await longText.getContentStructure();
      expect(structure.h2Count).toBeGreaterThanOrEqual(1);
    });

    await test.step('Test responsive behavior - desktop viewport', async () => {
      await page.setViewportSize({ width: 1200, height: 800 });
      await longText.waitForContent();
      const structure = await longText.getContentStructure();
      expect(structure.h2Count).toBeGreaterThanOrEqual(1);
    });

    await test.step('Test keyboard navigation', async () => {
      const isNavigable = await longText.isKeyboardNavigable();
      expect(isNavigable).toBe(true);
    });

    await test.step('Test heading hierarchy', async () => {
      const hasProperHierarchy = await longText.hasProperHeadingHierarchy();
      expect(hasProperHierarchy).toBe(true);
    });
  });
});
