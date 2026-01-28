import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './icon-list.spec.cjs';
import IconList from './icon-list.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let iconList;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Icon List Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    iconList = new IconList(page);
  });

  // Test 0 : Icon List default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to icon-list block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify icon-list default block content/specs', async () => {
      await expect(iconList.iconList).toBeVisible();
      await expect(iconList.defaultHeading.nth(0)).toContainText(data.h1Text);
      await expect(iconList.defaultHeading.nth(1)).toContainText(data.h2Text);
      await expect(iconList.defaultHeading.nth(2)).toContainText(data.h3Text);
      await expect(iconList.defaultHeading.nth(3)).toContainText(data.h4Text);
      await expect(iconList.defaultContent.nth(0)).toContainText(data.p1Text);
      await expect(iconList.defaultContent.nth(1)).toContainText(data.p2Text);
      await expect(iconList.defaultContent.nth(2)).toContainText(data.p3Text);
      await expect(iconList.defaultContent.nth(3)).toContainText(data.p4Text);
      await expect(iconList.defaultIMGImages).toHaveCount(data.imgImageCount);
      await expect(iconList.defaultSVGImages).toHaveCount(data.imgSvgCount);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(iconList.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(iconList.iconList).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('icon-list', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: iconList.iconList });
    });
  });

  // Test 1 : Icon List fullwidth
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;

    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to icon-list(fullwidth) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify icon-list(fullwidth) block content/specs', async () => {
      await expect(iconList.variants.fullwidth).toBeVisible();
      await expect(iconList.fullwidthVariantHeading.nth(0)).toContainText(data.h1Text);
      await expect(iconList.fullwidthVariantHeading.nth(1)).toContainText(data.h2Text);
      await expect(iconList.fullwidthVariantHeading.nth(2)).toContainText(data.h3Text);
      await expect(iconList.fullwidthVariantHeading.nth(3)).toContainText(data.h4Text);
      await expect(iconList.fullwidthVariantContent.nth(0)).toContainText(data.p1Text);
      await expect(iconList.fullwidthVariantContent.nth(1)).toContainText(data.p2Text);
      await expect(iconList.fullwidthVariantContent.nth(2)).toContainText(data.p3Text);
      await expect(iconList.fullwidthVariantContent.nth(3)).toContainText(data.p4Text);
      await expect(iconList.fullwidthVariantIMGImages).toHaveCount(data.imgImageCount);
      await expect(iconList.fullwidthVariantSVGImages).toHaveCount(data.imgSvgCount);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(iconList.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(iconList.variants.fullwidth).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('icon-list', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: iconList.variants.fullwidthVariant });
    });
  });
});
