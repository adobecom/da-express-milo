const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./image-reveal.spec.cjs');
const ImageRevealBlock = require('./image-reveal.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('ImageRevealBlock Test Suite', () => {
  // Test Id : 0 : @image-reveal-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new ImageRevealBlock(page, features[0].selector);
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
        const isHiddenSelector = m.selector.includes('.isHidden');
        const isPicture = m.tag === 'picture';
        const target = isPicture ? locator.locator('img') : locator;
        if (isHiddenSelector) {
          await expect(target).toBeHidden();
        } else {
          await expect(target).toBeVisible();
        }
      }

      for (const iEl of sem.interactives) {
        const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
        await expect(locator).toBeVisible({ timeout: 8000 });
        if (iEl.type === 'link' && iEl.href) {
          const href = await locator.getAttribute('href');
          if (/^(tel:|mailto:|sms:|ftp:|[+]?[\d])/i.test(iEl.href)) {
            await expect(href).toBe(iEl.href);
          } else {
            const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
            const actualPath = new URL(href, 'https://dummy.base').pathname;
            await expect(actualPath).toBe(expectedPath);
          }
        }
        if (iEl.text) await expect(locator).toContainText(iEl.text);
      }
    });

    await test.step('step-3: Slider is keyboard operable', async () => {
      await expect(block.handle).toHaveAttribute('role', 'slider');
      await expect(block.handle).toHaveAttribute('aria-valuenow', '50');
      await block.handle.focus();
      await page.keyboard.press('ArrowLeft');
      await expect(block.handle).toHaveAttribute('aria-valuenow', '49');
      await page.keyboard.press('End');
      await expect(block.handle).toHaveAttribute('aria-valuenow', '100');
    });

    await test.step('step-4: Effect and image controls update the stage', async () => {
      await block.effectRadios.nth(2).dispatchEvent('change');
      await expect(block.stage).toHaveAttribute('data-effect', 'duotone');
      await block.swapRadios.nth(1).dispatchEvent('change');
      const originalSrc = await block.originalImage.getAttribute('src');
      const thumbSrc = await block.block.locator('.image-reveal-thumb-img--grayscale img').getAttribute('src');
      expect(originalSrc).toBeTruthy();
      expect(thumbSrc).toBeTruthy();
    });

    await test.step('step-5: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-6: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
