const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./simple-marquee.spec.cjs');
const SimpleMarqueeBlock = require('./simple-marquee.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

test.describe('SimpleMarqueeBlock Test Suite', () => {
  features.forEach((feature) => {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({ page, baseURL }) => {
      const { data } = feature;
      const testUrl = `${baseURL}${feature.path}`;
      const block = new SimpleMarqueeBlock(page, feature.selector);
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Navigate to page', async () => {
        await page.goto(testUrl);
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(testUrl);
      });

      await test.step('step-2: Verify block content', async () => {
        await expect(block.block).toBeVisible();
        const sem = data.semantic;

        for (const t of sem.texts) {
          const locator = block.block.locator(t.selector).nth(t.nth || 0);
          await expect(locator).toContainText(t.text);
        }

        for (const m of sem.media) {
          const locator = block.block.locator(m.selector).nth(m.nth || 0);
          await expect(locator).toBeVisible();
        }

        for (const iEl of sem.interactives) {
          const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
          await expect(locator).toBeVisible({ timeout: 8000 });
          if (iEl.type === 'link' && iEl.href) {
            const href = await locator.getAttribute('href');
            const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
            const actualPath = new URL(href, 'https://dummy.base').pathname;
            await expect(actualPath).toBe(expectedPath);
          }
          if (iEl.text) await expect(locator).toContainText(iEl.text);
        }
      });

      await test.step('step-3: Accessibility validation', async () => {
        await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
      });

      await test.step('step-4: SEO validation', async () => {
        await runSeoChecks({ page, feature, skipSeoTest: false });
      });
    });
  });
});
