const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./mobile-fork-button.spec.cjs');
const MobileForkButtonBlock = require('./mobile-fork-button.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('MobileForkButtonBlock Test Suite', () => {
  for (const feature of features) {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags}`, async ({
      page, baseURL, isMobile, userAgent,
    }) => {
      const { data } = feature;
      const testUrl = `${baseURL}${feature.path}${miloLibs}`;
      const block = new MobileForkButtonBlock(page, feature.selector);
      const expectsFork = isMobile && /Android/i.test(userAgent);
      const semantic = expectsFork ? data.semantic : data.fallback.semantic;
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Navigate to the metadata-driven test page', async () => {
        await page.goto(testUrl);
        await expect(page).toHaveURL(testUrl);
        await expect(block.pageHeading).toHaveText(data.pageHeading);
        await expect(block.eligibility).toHaveAttribute('content', 'on');
      });

      await test.step('step-2: Verify Android fork or iOS/desktop fallback content', async () => {
        await expect(block.wrapper).toHaveCount(1);
        await expect(block.block).toHaveAttribute('data-block-status', 'loaded');
        await expect(block.block).toBeVisible();
        await expect(block.wrapper).toHaveAttribute('data-audience', isMobile ? 'mobile' : 'desktop');

        if (expectsFork) {
          await expect(block.wrapper).toHaveClass(/mobile-fork-button/);
          await expect(block.rows).toHaveCount(2);
        } else {
          await expect(block.wrapper).not.toHaveClass(/mobile-fork-button/);
          await expect(block.rows).toHaveCount(0);
        }
        await expect(block.links).toHaveCount(semantic.interactives.length);

        for (const text of semantic.texts) {
          await expect(block.block.locator(text.selector).nth(text.nth || 0)).toHaveText(text.text);
        }
        for (const media of semantic.media) {
          await expect(block.block.locator(media.selector).nth(media.nth || 0)).toBeVisible();
        }
        for (const interactive of semantic.interactives) {
          const link = block.block.locator(interactive.selector).nth(interactive.nth || 0);
          await expect(link).toBeVisible();
          await expect(link).toHaveAccessibleName(interactive.text);
          const href = await link.getAttribute('href');
          expect(new URL(href, testUrl).href).toBe(new URL(interactive.href, testUrl).href);
        }
      });

      await test.step('step-3: Accessibility validation', async () => {
        await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
      });

      await test.step('step-4: SEO validation', async () => {
        await runSeoChecks({ page, feature });
      });

      await test.step('step-5: Verify the CTA remains in view while scrolling', async () => {
        await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'instant' }));
        await expect(block.block).toBeInViewport();
        await expect(block.wrapper).not.toHaveAttribute('inert', '');
      });

      await test.step('step-6: Verify each CTA navigates to its authored destination', async () => {
        for (const interactive of semantic.interactives) {
          await block.scrollToTop();
          await expect(block.wrapper).not.toHaveAttribute('inert', '');
          const link = block.block.locator(interactive.selector).nth(interactive.nth || 0);
          await link.click();
          await expect(page).toHaveURL(new URL(interactive.href, testUrl).href);
          await expect(page.locator(interactive.href)).toBeInViewport();
        }
      });
    });
  }
});
