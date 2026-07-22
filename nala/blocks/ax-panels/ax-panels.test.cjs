const { test, expect } = require('@playwright/test');
const { features } = require('./ax-panels.spec.cjs');
const AxPanelsBlock = require('./ax-panels.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

test.describe('AxPanelsBlock Test Suite', () => {
  // Test Id : 0 : @ax-panels-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}`;
    const block = new AxPanelsBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify ax-panels block structure', async () => {
      await expect(block.block).toBeVisible();

      // Verify heading
      const heading = block.block.locator('.ax-panels-heading-container h2');
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(data.semantic.texts[0].text);

      // Verify tablist exists
      const tablist = block.block.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      // Verify tabs are present
      const tabs = block.block.locator('button[role="tab"]');
      const tabCount = await tabs.count();
      await expect(tabCount).toBeGreaterThanOrEqual(3);

      // Verify tab content from test data
      for (const iEl of data.semantic.interactives) {
        if (iEl.type === 'tab') {
          const tab = block.block.locator(iEl.selector).nth(iEl.nth || 0);
          await expect(tab).toBeVisible();
          if (iEl.text) await expect(tab).toContainText(iEl.text);

          // Verify ARIA attributes
          await expect(tab).toHaveAttribute('aria-selected');
          await expect(tab).toHaveAttribute('aria-controls');
        }
      }
    });

    await test.step('step-3: Verify tab interaction', async () => {
      const tabs = block.block.locator('button[role="tab"]');
      const firstTab = tabs.nth(0);
      const secondTab = tabs.nth(1);

      // First tab should be selected by default
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');

      // Click second tab
      await secondTab.click();
      await expect(secondTab).toHaveAttribute('aria-selected', 'true');
      await expect(firstTab).toHaveAttribute('aria-selected', 'false');

      // Verify corresponding panels toggle visibility
      const panels = page.locator('[role="tabpanel"]');
      const panelCount = await panels.count();
      if (panelCount > 0) {
        const firstPanel = panels.nth(0);
        const secondPanel = panels.nth(1);
        await expect(firstPanel).toHaveClass(/hide/);
        await expect(secondPanel).not.toHaveClass(/hide/);
      }
    });

    await test.step('step-4: Verify keyboard navigation', async () => {
      const tabs = block.block.locator('button[role="tab"]');
      const tablist = block.block.locator('[role="tablist"]');
      const firstTab = tabs.nth(0);

      // Click first tab to focus
      await firstTab.click();
      await expect(firstTab).toHaveAttribute('aria-selected', 'true');

      // Press ArrowRight to navigate to next tab
      await tablist.press('ArrowRight');
      const secondTab = tabs.nth(1);
      await expect(secondTab).toHaveAttribute('aria-selected', 'true');
      await expect(firstTab).toHaveAttribute('aria-selected', 'false');
    });

    await test.step('step-5: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-6: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
