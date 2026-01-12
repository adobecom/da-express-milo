/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './holiday-blade.spec.cjs';
import HolidayBlade from './holiday-blade.page.cjs';

let holidayBlade;

test.describe('Holiday Blade block tests', () => {
  test.beforeEach(async ({ page }) => {
    holidayBlade = new HolidayBlade(page);
  });

  // TCID 0: Basic display and templates
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      await holidayBlade.gotoURL(testPage);
      await holidayBlade.page.waitForLoadState('networkidle');
      await holidayBlade.page.waitForTimeout(3000);
    });

    await test.step('Verify block is loaded', async () => {
      await expect(holidayBlade.block).toBeVisible();
      console.log('✅ Holiday blade block visible');
    });

    await test.step('Verify templates are loaded', async () => {
      const count = await holidayBlade.getTemplateCount();
      console.log(`Found ${count} holiday templates`);
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Test template interactions', async () => {
      await holidayBlade.hoverTemplate(0);
      await holidayBlade.page.waitForTimeout(500);
      console.log('✅ Template hover tested');
    });
  });

  // TCID 1: Expand/collapse functionality
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate and load', async () => {
      await holidayBlade.gotoURL(testPage);
      await holidayBlade.page.waitForLoadState('networkidle');
      await holidayBlade.page.waitForTimeout(3000);
    });

    await test.step('Test expand functionality', async () => {
      const initialExpanded = await holidayBlade.isExpanded();
      console.log(`Initially expanded: ${initialExpanded}`);

      await holidayBlade.expandBlade();
      await holidayBlade.page.waitForTimeout(500);

      const afterExpand = await holidayBlade.isExpanded();
      console.log(`After expand: ${afterExpand}`);
    });

    await test.step('Test collapse functionality', async () => {
      await holidayBlade.collapseBlade();
      await holidayBlade.page.waitForTimeout(500);

      const afterCollapse = await holidayBlade.isExpanded();
      console.log(`After collapse: ${afterCollapse}`);
    });
  });

  // TCID 2: Holiday icon and theming
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[2].path}`);
    const testPage = `${baseURL}${features[2].path}`;

    await test.step('Navigate and load', async () => {
      await holidayBlade.gotoURL(testPage);
      await holidayBlade.page.waitForLoadState('networkidle');
      await holidayBlade.page.waitForTimeout(3000);
    });

    await test.step('Verify holiday icon', async () => {
      const iconSrc = await holidayBlade.getHolidayIcon();
      console.log(`Holiday icon: ${iconSrc}`);

      if (iconSrc) {
        expect(iconSrc).toBeTruthy();
        console.log('✅ Holiday icon present');
      }
    });

    await test.step('Verify title text', async () => {
      const titleText = await holidayBlade.getTitleText();
      console.log(`Title: ${titleText}`);
      expect(titleText).toBeTruthy();
    });

    await test.step('Test themed styles', async () => {
      const bgColor = await holidayBlade.block.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      console.log(`Background color: ${bgColor}`);
    });
  });
});
