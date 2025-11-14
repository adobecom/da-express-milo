import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './banner.spec.cjs';
import Banner from './banner.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let banner;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Banner Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    banner = new Banner(page);
  });

  // Test 0 : Banner default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testPage = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to banner block test page', async () => {
      await page.goto(testPage);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify banner default block content/specs', async () => {
      await expect(banner.banner).toBeVisible();
      await expect(banner.defaultBannerHeading).toContainText(data.headingText);
      await expect(banner.defaultBannerButton).toContainText(data.buttonText);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(banner.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(banner.banner).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('banner', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: banner.banner });
    });
    await test.step('Validate card button click', async () => {
      await banner.defaultBannerButton.click();
      expect(page.url).not.toBe(testPage);
    });
  });

  // Test 1 : Banner light
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testPage = `${baseURL}${features[1].path}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to banner light block test page', async () => {
      await page.goto(testPage);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify banner light block content/specs', async () => {
      await expect(banner.variants.light).toBeVisible();
      await expect(banner.lightVariantHeading).toContainText(data.headingText);
      await expect(banner.lightVariantContent).toContainText(data.pText);
      await expect(banner.lightVariantButton).toContainText(data.buttonText);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(banner.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(banner.variants.light).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('banner', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: banner.variants.light });
    });

    await test.step('Validate card button click', async () => {
      await banner.lightVariantButton.click();
      expect(page.url).not.toBe(testPage);
    });
  });

  // Test 2 : Banner standout
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testPage = `${baseURL}${features[2].path}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to banner standout block test page', async () => {
      await page.goto(testPage);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify banner standout block content/specs', async () => {
      await expect(banner.variants.standout).toBeVisible();
      await expect(banner.standoutVariantHeading).toContainText(data.headingText);
      await expect(banner.standoutVariantButton).toContainText(data.buttonText);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(banner.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(banner.variants.standout).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('banner', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: banner.variants.standout });
    });

    await test.step('Validate card button click', async () => {
      await banner.standoutVariantButton.click();
      expect(page.url).not.toBe(testPage);
    });
  });

  // Test 3 : Banner cool
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testPage = `${baseURL}${features[3].path}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to banner cool block test page', async () => {
      await page.goto(testPage);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify banner cool block content/specs', async () => {
      await expect(banner.variants.cool).toBeVisible();
      await expect(banner.coolVariantHeading).toContainText(data.headingText);
      await expect(banner.coolVariantButton).toContainText(data.buttonText);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(banner.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(banner.variants.cool).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('banner', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: banner.variants.cool });
    });

    await test.step('Validate card button click', async () => {
      await banner.coolVariantButton.click();
      expect(page.url).not.toBe(testPage);
    });
  });

  // Test 4 : Banner default heading h3
  test(`[Test Id - ${features[4].tcid}] ${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    const testPage = `${baseURL}${features[4].path}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to banner block test page', async () => {
      await page.goto(testPage);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify banner default block content/specs', async () => {
      await expect(banner.banner).toBeVisible();
      await expect(banner.defaultBannerHeading3).toBeVisible();
      await expect(banner.defaultBannerHeading3).toContainText(data.headingText);
      await expect(banner.defaultBannerButton).toContainText(data.buttonText);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(banner.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(banner.banner).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('banner', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: banner.banner });
    });
    await test.step('Validate card button click', async () => {
      await banner.defaultBannerButton.click();
      expect(page.url).not.toBe(testPage);
    });
  });

  // Test 5 : Banner light multiple buttons
  test(`[Test Id - ${features[5].tcid}] ${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
    const { data } = features[5];
    const testPage = `${baseURL}${features[5].path}${miloLibs}`;
    console.info(`[Test Page]: ${testPage}`);

    await test.step('Go to banner block test page', async () => {
      await page.goto(testPage);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testPage);
    });

    await test.step('Verify light variant with multiple buttons block content/specs', async () => {
      await expect(banner.variants.light).toBeVisible();
      await expect(banner.lightVariantHeading).toContainText(data.headingText);
      await expect(banner.lightVariantButton).toContainText(data.buttonText);
      await expect(banner.lightVariantButton2).toContainText(data.buttonText);
      await expect(banner.lightVariantButton3).toContainText(data.buttonText);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(banner.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(banner.variants.light).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('banner', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: banner.variants.light });
    });

    await test.step('Validate card hover', async () => {
      const buttonBackgroundColorBeforeHover = await banner.lightVariantButton.evaluate((element) => window.getComputedStyle(element).backgroundColor);
      await banner.lightVariantButton.hover();
      await page.waitForTimeout(1000);
      const buttonBackgroundColorInHoverState = await banner.lightVariantButton.evaluate((element) => window.getComputedStyle(element).backgroundColor);
      await banner.lightVariantHeading.hover(); // move away
      await page.waitForTimeout(1000);
      const buttonBackgroundColorAfterHover = await banner.lightVariantButton.evaluate((element) => window.getComputedStyle(element).backgroundColor);
      expect(buttonBackgroundColorBeforeHover).not.toEqual(buttonBackgroundColorInHoverState);
      expect(buttonBackgroundColorAfterHover).toEqual(buttonBackgroundColorBeforeHover);
    });

    await test.step('Validate card button click', async () => {
      await banner.lightVariantButton.click();
      expect(page.url).not.toBe(testPage);
    });
  });
});
