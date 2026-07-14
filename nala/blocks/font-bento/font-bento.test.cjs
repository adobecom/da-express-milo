const { test, expect } = require('@playwright/test');
const { features } = require('./font-bento.spec.cjs');
const FontBentoBlock = require('./font-bento.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('FontBentoBlock Test Suite', () => {
  // Test Id : 0 : @font-bento-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new FontBentoBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block loads and decorates', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.header).toBeVisible();
      await expect(block.grid).toBeVisible();
    });

    await test.step('step-3: Verify header content', async () => {
      const sem = data.semantic;
      for (const t of sem.texts) {
        const locator = block.block.locator(t.selector).nth(t.nth || 0);
        await expect(locator).toContainText(t.text);
      }
    });

    await test.step('step-4: Verify 6 bento cards with media', async () => {
      for (let i = 1; i <= 6; i++) {
        const card = block.card(i);
        await expect(card).toBeVisible();
        await expect(card.locator('.font-bento-card-media')).toBeVisible();
        await expect(card.locator('picture')).toBeVisible();
      }
    });

    await test.step('step-5: Verify media images', async () => {
      const sem = data.semantic;
      for (const m of sem.media) {
        const locator = block.block.locator(m.selector).nth(m.nth || 0);
        const target = locator.locator('img');
        await expect(target).toBeVisible();
      }
    });

    await test.step('step-6: Verify CTA link', async () => {
      const sem = data.semantic;
      for (const iEl of sem.interactives) {
        const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
        await expect(locator).toBeVisible({ timeout: 8000 });
        if (iEl.text) await expect(locator).toContainText(iEl.text);
        if (iEl.href) {
          const href = await locator.getAttribute('href');
          const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
          const actualPath = new URL(href, 'https://dummy.base').pathname;
          await expect(actualPath).toBe(expectedPath);
        }
      }
    });

    await test.step('step-7: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-8: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
