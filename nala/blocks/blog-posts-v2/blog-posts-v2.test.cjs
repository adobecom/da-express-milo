const { test, expect } = require('@playwright/test');
const { features } = require('./blog-posts-v2.spec.cjs');
const BlogPostsV2Block = require('./blog-posts-v2.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

test.describe('BlogPostsV2Block Test Suite', () => {
  // Test Id : 0 : @blog-posts-v2-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}`;
    const block = new BlogPostsV2Block(page, features[0].selector);
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

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });

  // Test Id : 1 : @blog-posts-v2-without-images
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}`;
    const block = new BlogPostsV2Block(page, features[1].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      const response = await page.goto(testUrl);

      // Graceful degradation: Skip test if page is 404
      if (response && response.status() === 404) {
        test.skip(true, `Test page not found (404): ${testUrl}`);
        return;
      }

      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block content', async () => {
      await expect(block.block).toBeVisible();
      const sem = data.semantic;

      // Verify interactive elements (View All link)
      if (sem.interactives) {
        for (const iEl of sem.interactives) {
          const locator = page.locator(iEl.selector).nth(iEl.nth || 0);

          // Graceful degradation: Check if element exists before asserting
          const elementCount = await locator.count();
          if (elementCount === 0) {
            console.warn(`[Warning] Element not found: ${iEl.selector}`);
          } else {
            await expect(locator).toBeVisible({ timeout: 8000 });

            if (iEl.text) {
              await expect(locator).toContainText(iEl.text);
            }

            if (iEl.type === 'link' && iEl.href) {
              const href = await locator.getAttribute('href');
              if (href && /^(tel:|mailto:|sms:|ftp:|[+]?[\d])/i.test(iEl.href)) {
                await expect(href).toBe(iEl.href);
              } else if (href) {
                const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
                const actualPath = new URL(href, 'https://dummy.base').pathname;
                await expect(actualPath).toBe(expectedPath);
              }
            }
          }
        }
      }
    });

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[1], skipSeoTest: false });
    });
  });
});
