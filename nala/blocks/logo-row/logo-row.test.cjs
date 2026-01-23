import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './logo-row.spec.cjs';
import LogoRow from './logo-row.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let webUtil;
let logoRow;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Logo Row Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    logoRow = new LogoRow(page);
  });

  // Test 0 : Logo Row
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;

    await test.step('Go to logo row block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify logo row block content/specs', async () => {
      await expect(logoRow.logoRow).toBeVisible();
      await expect(logoRow.logoRow.nth(0)).toContainText(data.h5Text);
      await expect(logoRow.logoImage).toHaveCount(data.logoImageCount);
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(logoRow.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(logoRow.logoRow).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('logo-row', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: logoRow.logoRow });
    });
  });
});
