import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './long-text.spec.cjs';
import LongText from './long-text.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let longText;

const miloLibs = process.env.MILO_LIBS || '';

async function openLongTextPage({ page, baseURL }) {
  const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
  console.info(`[Test Page]: ${testUrl}`);
  await longText.gotoURL(testUrl);
  await expect(page).toHaveURL(testUrl);
  await longText.waitForContent();
  await expect(longText.longText.first()).toBeVisible();
}

test.describe('Express Long Text Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    longText = new LongText(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name} core behavior,${features[0].tags}`, async ({ page, baseURL }) => {
    await test.step('Go to long-text block test page', async () => {
      await openLongTextPage({ page, baseURL });
    });

    await test.step('Verify basic structure', async () => {
      const structure = await longText.getContentStructure();
      expect(structure.h2Count).toBeGreaterThanOrEqual(1);
      expect(structure.pCount).toBeGreaterThanOrEqual(1);
    });

    await test.step('Verify plain variant functionality', async () => {
      const plainExists = await longText.variants.plain.count() > 0;
      if (plainExists) {
        await expect(longText.variants.plain.first()).toBeVisible();
        const plainWrapper = longText.variants.plain.first().locator('xpath=..');
        await expect(plainWrapper).toHaveClass(/plain/);
        await expect(longText.variants.plain.first().locator('article')).toHaveCount(0);
      }
    });

    await test.step('Verify no-background variant functionality', async () => {
      const noBackgroundExists = await longText.variants.noBackground.count() > 0;
      if (noBackgroundExists) {
        const noBackgroundCount = await longText.variants.noBackground.count();
        for (let i = 0; i < noBackgroundCount; i += 1) {
          await expect(longText.variants.noBackground.nth(i)).toBeVisible();
        }
        const noBackgroundWrapper = longText.variants.noBackground.first().locator('xpath=..');
        await expect(noBackgroundWrapper).toHaveClass(/no-background/);

        const noBackgroundStructure = await longText.getNoBackgroundStructure();
        expect(noBackgroundStructure.hasSemanticStructure).toBe(true);
        expect(noBackgroundStructure.articleCount).toBeGreaterThanOrEqual(1);

        for (const article of noBackgroundStructure.articles) {
          const hasHeading = article.hasH2 || article.hasH3 || article.hasH4;
          expect(hasHeading).toBe(true);
          expect(article.hasP).toBe(true);
        }
      }
    });

    await test.step('Verify design tokens and analytics', async () => {
      const tokens = LongText.getDesignTokens();
      expect(tokens.h2Color).toBeTruthy();
      expect(tokens.h2FontSize).toBeTruthy();
      expect(tokens.pColor).toBeTruthy();
      expect(tokens.pFontSize).toBeTruthy();
      await expect(longText.longText.first()).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('long-text', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: longText.longText.first() });
    });
  });

  test(`[Test Id - ${features[0].tcid}] @long-text responsive behavior,${features[0].tags}`, async ({ page, baseURL }) => {
    await test.step('Go to long-text block test page', async () => {
      await openLongTextPage({ page, baseURL });
    });

    await test.step('Verify responsive content across viewports', async () => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1200, height: 800 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await longText.waitForContent();
        const structure = await longText.getContentStructure();
        expect(structure.h2Count).toBeGreaterThanOrEqual(1);
      }
    });
  });

  test(`[Test Id - ${features[0].tcid}] @long-text semantic checks,${features[0].tags}`, async ({ page, baseURL }) => {
    await test.step('Go to long-text block test page', async () => {
      await openLongTextPage({ page, baseURL });
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
