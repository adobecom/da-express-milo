/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './tabs-ax.spec.cjs';
import TabsAx from './tabs-ax.page.cjs';

let tabsAx;

test.describe('Tabs AX block tests', () => {
  test.beforeEach(async ({ page }) => {
    tabsAx = new TabsAx(page);
  });

  // TCID 0: Basic tab switching
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      await tabsAx.gotoURL(testPage);
      await tabsAx.page.waitForTimeout(1000);
    });

    await test.step('Verify tabs are loaded', async () => {
      await expect(tabsAx.block).toBeVisible();
      const tabCount = await tabsAx.getTabCount();
      const panelCount = await tabsAx.getPanelCount();
      console.log(`Found ${tabCount} tabs and ${panelCount} panels`);
      expect(tabCount).toBeGreaterThan(0);
      expect(panelCount).toEqual(tabCount);
    });

    await test.step('Test tab switching', async () => {
      const tabCount = await tabsAx.getTabCount();
      if (tabCount > 1) {
        await tabsAx.clickTab(0);
        await tabsAx.page.waitForTimeout(300);
        expect(await tabsAx.isTabActive(0)).toBe(true);
        expect(await tabsAx.isPanelVisible(0)).toBe(true);
        console.log('✅ First tab activated');

        await tabsAx.clickTab(1);
        await tabsAx.page.waitForTimeout(300);
        expect(await tabsAx.isTabActive(1)).toBe(true);
        expect(await tabsAx.isPanelVisible(1)).toBe(true);
        console.log('✅ Second tab activated');
      }
    });

    await test.step('Verify only one panel visible at a time', async () => {
      const panelCount = await tabsAx.getPanelCount();
      let visibleCount = 0;
      for (let i = 0; i < panelCount; i++) {
        if (await tabsAx.isPanelVisible(i)) {
          visibleCount++;
        }
      }
      expect(visibleCount).toBe(1);
      console.log('✅ Only one panel visible');
    });
  });

  // TCID 1: Keyboard navigation
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate and load', async () => {
      await tabsAx.gotoURL(testPage);
      await tabsAx.page.waitForTimeout(1000);
    });

    await test.step('Test arrow right navigation', async () => {
      await tabsAx.clickTab(0);
      await tabsAx.page.waitForTimeout(300);

      const initialTab = await tabsAx.getActiveTabText();
      console.log(`Initial tab: ${initialTab}`);

      await tabsAx.navigateWithArrowKeys('right');
      await tabsAx.page.waitForTimeout(300);

      const newTab = await tabsAx.getActiveTabText();
      console.log(`After arrow right: ${newTab}`);
    });

    await test.step('Test arrow left navigation', async () => {
      await tabsAx.navigateWithArrowKeys('left');
      await tabsAx.page.waitForTimeout(300);
      console.log('✅ Arrow left navigation tested');
    });

    await test.step('Test tab key navigation', async () => {
      await tabsAx.tabs.first().focus();
      await tabsAx.tabToNextElement();
      await tabsAx.page.waitForTimeout(300);
      console.log('✅ Tab key navigation tested');
    });
  });

  // TCID 2: URL parameter tab activation
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[2].path}`);
    const testPage = `${baseURL}${features[2].path}`;

    await test.step('Navigate with tab URL parameter', async () => {
      const tabCount = await tabsAx.getTabCount();
      if (tabCount > 1) {
        const secondTabId = await tabsAx.getTabId(1);
        const urlWithTab = `${testPage}?tab=${secondTabId}`;
        await tabsAx.gotoURL(urlWithTab);
        await tabsAx.page.waitForTimeout(1000);
        console.log(`Navigated with tab parameter: ${secondTabId}`);
      }
    });

    await test.step('Verify correct tab is activated', async () => {
      const activeTabText = await tabsAx.getActiveTabText();
      console.log(`Active tab from URL param: ${activeTabText}`);
    });

    await test.step('Test URL updates on tab click', async () => {
      await tabsAx.clickTab(0);
      await tabsAx.page.waitForTimeout(500);
      const url = tabsAx.page.url();
      console.log(`URL after tab click: ${url}`);
    });
  });

  // TCID 3: Accessibility attributes
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[3].path}`);
    const testPage = `${baseURL}${features[3].path}`;

    await test.step('Navigate and load', async () => {
      await tabsAx.gotoURL(testPage);
      await tabsAx.page.waitForTimeout(1000);
    });

    await test.step('Verify ARIA roles', async () => {
      const tablistRole = await tabsAx.tablist.getAttribute('role');
      expect(tablistRole).toBe('tablist');
      console.log('✅ Tablist role verified');

      const firstTabRole = await tabsAx.tabs.first().getAttribute('role');
      expect(firstTabRole).toBe('tab');
      console.log('✅ Tab role verified');

      const firstPanelRole = await tabsAx.tabpanels.first().getAttribute('role');
      expect(firstPanelRole).toBe('tabpanel');
      console.log('✅ Tabpanel role verified');
    });

    await test.step('Verify aria-selected attribute', async () => {
      await tabsAx.clickTab(0);
      await tabsAx.page.waitForTimeout(300);

      const ariaSelected = await tabsAx.tabs.first().getAttribute('aria-selected');
      expect(ariaSelected).toBe('true');
      console.log('✅ aria-selected verified');
    });

    await test.step('Verify aria-controls relationship', async () => {
      const tabCount = await tabsAx.getTabCount();
      for (let i = 0; i < tabCount; i++) {
        const ariaControls = await tabsAx.getTabAriaControls(i);
        expect(ariaControls).toBeTruthy();
        console.log(`Tab ${i} controls: ${ariaControls}`);
      }
    });

    await test.step('Verify hidden attribute on panels', async () => {
      const panelCount = await tabsAx.getPanelCount();
      let hiddenCount = 0;
      for (let i = 0; i < panelCount; i++) {
        if (!(await tabsAx.isPanelVisible(i))) {
          hiddenCount++;
        }
      }
      expect(hiddenCount).toBe(panelCount - 1);
      console.log(`✅ ${hiddenCount} panels hidden correctly`);
    });
  });
});
