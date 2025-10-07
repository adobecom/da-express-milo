import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './quotes.spec.cjs';
import Quotes from './quotes.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let quotes;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Quotes Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    quotes = new Quotes(page);
  });

  // Test 0 : Quotes default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to quotes block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify quotes default block content/specs', async () => {
      await expect(quotes.variants.defaultVariant).toBeVisible();
      await expect(quotes.defaultVariantQuote.nth(0)).toContainText(data.quote1Text);
      await expect(quotes.defaultVariantAuthorSummary.nth(0)).toContainText(data.authorSummaryText1);
      await expect(quotes.defaultVariantQuote.nth(1)).toContainText(data.quote2Text);
      await expect(quotes.defaultVariantAuthorSummary.nth(1)).toContainText(data.authorSummaryText2);
      await expect(quotes.defaultVariantQuote.nth(2)).toContainText(data.quote3Text);
      await expect(quotes.defaultVariantAuthorSummary.nth(2)).toContainText(data.authorSummaryText3);
      await expect(quotes.defaultVariantQuote.nth(3)).toContainText(data.quote4Text);
      await expect(quotes.defaultVariantAuthorSummary.nth(3)).toContainText(data.authorSummaryText4);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(quotes.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(quotes.variants.defaultVariant).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('quotes', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotes.variants.defaultVariant });
    });
  });

  // Test 1 : Quotes default with photos
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to quotes block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify quotes default with photos block content/specs', async () => {
      await expect(quotes.variants.defaultPhotosVariant).toBeVisible();
      await expect(quotes.defaultPhotosVariantQuote.nth(0)).toContainText(data.quote1Text);
      await expect(quotes.defaultPhotosVariantAuthorSummary.nth(0)).toContainText(data.authorSummaryText1);
      await expect(quotes.defaultPhotosVariantQuote.nth(1)).toContainText(data.quote2Text);
      await expect(quotes.defaultPhotosVariantAuthorSummary.nth(1)).toContainText(data.authorSummaryText2);
      await expect(quotes.defaultPhotosVariantQuote.nth(2)).toContainText(data.quote3Text);
      await expect(quotes.defaultPhotosVariantAuthorSummary.nth(2)).toContainText(data.authorSummaryText3);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(quotes.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(quotes.variants.defaultPhotosVariant).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('quotes', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotes.variants.defaultPhotosVariant });
    });
  });

  // Test 2 : Quotes singular
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to quotes block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify quotes.singular block content/specs', async () => {
      await expect(quotes.variants.singularVariant).toBeVisible();
      await expect(quotes.singularVariantQuote.nth(0)).toContainText(data.quoteText);
      await expect(quotes.singularVariantAuthorDescription.nth(0)).toContainText(data.authorDescription);
      await expect(quotes.singularVariantAuthorImage).toHaveCount(data.authorImageCount);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(quotes.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(quotes.variants.singularVariant).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('quotes', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotes.variants.singularVariant });
    });
  });

  // Test 3 : Quotes carousel
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to quotes block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify quotes.carousel block content/specs', async () => {
      await expect(quotes.variants.carouselVariant).toBeVisible();
      await expect(quotes.carouselVariantQuote.nth(0)).toContainText(data.quote1Text);
      await expect(quotes.carouselVariantAuthorSummary.nth(0)).toContainText(data.authorSummaryText1);
      await expect(quotes.carouselVariantQuote.nth(1)).toContainText(data.quote2Text);
      await expect(quotes.carouselVariantAuthorSummary.nth(1)).toContainText(data.authorSummaryText2);
      await expect(quotes.carouselVariantQuote.nth(2)).toContainText(data.quote3Text);
      await expect(quotes.carouselVariantAuthorSummary.nth(2)).toContainText(data.authorSummaryText3);
      await expect(quotes.carouselVariantQuote.nth(3)).toContainText(data.quote4Text);
      await expect(quotes.carouselVariantAuthorSummary.nth(3)).toContainText(data.authorSummaryText4);
      await expect(quotes.carouselVariantQuote.nth(4)).toContainText(data.quote5Text);
      await expect(quotes.carouselVariantAuthorSummary.nth(4)).toContainText(data.authorSummaryText5);
      await expect(quotes.carouselVariantLeftArrowButton).toBeVisible();
      await expect(quotes.carouselVariantRightArrowButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(quotes.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(quotes.variants.carouselVariant).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('quotes', 1));
    });

    await test.step.skip('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: quotes.variants.carouselVariant });
    });
  });
});
