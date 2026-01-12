import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './ax-columns.spec.cjs';
import AxColumns from './ax-columns.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let axColumns;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express AX Columns Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    axColumns = new AxColumns(page);
  });

  // Test 0 : AX-Columns center
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to ax-columns(center) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify ax-columns(center) block content/specs', async () => {
      await expect(axColumns.variants.center).toBeVisible();
      await expect(axColumns.centerVariantHeading.nth(0)).toContainText(data.h2Text);
      await expect(axColumns.centerVariantContent.nth(0)).toContainText(data.p1Text);
      await expect(axColumns.centerVariantContent.nth(1)).toContainText(data.p2Text);
      await expect(axColumns.centerVariantImages).toHaveCount(data.imageCount);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(axColumns.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(axColumns.variants.center).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('ax-columns', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: axColumns.variants.center });
    });
  });

  // Test 1 : AX-Columns highlight
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;

    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to ax-columns(highlight) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify ax-columns(highlight) block content/specs', async () => {
      await expect(axColumns.variants.highlight).toBeVisible();
      await expect(axColumns.h4Text).toContainText(data.h4Text);
      await expect(axColumns.blueButton).toHaveAttribute('title', data.buttonText);
      // validate video overlay
      await axColumns.blueButton.click();
      await expect(axColumns.videoOverlay).toBeVisible();
      await expect(axColumns.videoPlayer).toBeVisible();

      await axColumns.closeOverlayButton.click();
      await expect(axColumns.videoOverlay).toBeHidden();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(axColumns.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(axColumns.variants.highlight).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('ax-columns', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: axColumns.variants.highlight });
    });
  });
});
