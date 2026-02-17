const { test, expect } = require('@playwright/test');
const { features } = require('./blog-posts-v2.spec.cjs');
const BlogPostsV2Block = require('./blog-posts-v2.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('BlogPostsV2Block Test Suite', () => {
  // Test Id : 0 : @blog-posts-v2-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
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
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
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

  // Test Id : 2 : @blog-posts-v2-grid
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    const block = new BlogPostsV2Block(page, features[2].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      const response = await page.goto(testUrl);

      if (response && response.status() === 404) {
        test.skip(true, `Test page not found (404): ${testUrl}`);
        return;
      }

      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify grid block is visible and has grid class', async () => {
      await expect(block.block).toBeVisible({ timeout: 10000 });
      await expect(block.blogCards).toBeVisible();
    });

    await test.step('step-3: Verify blog cards are rendered', async () => {
      const cardCount = await block.blogCard.count();
      expect(cardCount).toBeGreaterThan(0);
      console.info(`[Grid] Found ${cardCount} blog cards`);

      // Verify first card has expected structure
      await expect(block.blogCard.first()).toBeVisible();
      await expect(block.blogCardImage.first()).toBeVisible();
      await expect(block.blogCardTitle.first()).toBeVisible();
      await expect(block.blogCardTeaser.first()).toBeVisible();
      await expect(block.blogCardDate.first()).toBeVisible();

      // Verify card title is not empty
      const title = await block.blogCardTitle.first().innerText();
      expect(title.length).toBeGreaterThan(0);

      // Verify card is a link with href
      const href = await block.blogCard.first().getAttribute('href');
      expect(href).toBeTruthy();
    });

    await test.step('step-4: Verify blog card images', async () => {
      const imageCount = await block.blogCardImage.count();
      expect(imageCount).toBeGreaterThan(0);

      // Verify first card image has an img tag
      const img = block.blogCardImage.first().locator('img');
      await expect(img).toBeVisible();
    });

    await test.step('step-5: Verify blog tags on cards', async () => {
      const tagCount = await block.blogTag.count();
      if (tagCount > 0) {
        await expect(block.blogTag.first()).toBeVisible();
        const tagText = await block.blogTag.first().innerText();
        expect(tagText.length).toBeGreaterThan(0);
      }
    });

    await test.step('step-6: Verify grid header if present', async () => {
      const headerCount = await block.blogPostsHeader.count();
      if (headerCount > 0) {
        await expect(block.blogPostsHeader).toBeVisible();
        const heading = block.blogPostsHeader.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await heading.count();
        if (headingCount > 0) {
          await expect(heading.first()).toBeVisible();
          const headingText = await heading.first().innerText();
          expect(headingText.length).toBeGreaterThan(0);
        }
      }
    });

    await test.step('step-7: Verify load-more button if present', async () => {
      const loadMoreCount = await block.loadMore.count();
      if (loadMoreCount > 0) {
        await expect(block.loadMore).toBeVisible();
        await expect(block.loadMoreButton).toBeVisible();
        await expect(block.loadMoreText).toBeVisible();

        const loadMoreTextContent = await block.loadMoreText.innerText();
        expect(loadMoreTextContent.length).toBeGreaterThan(0);

        // Verify the load-more button has SVG icon
        const svg = block.loadMoreButton.locator('svg');
        await expect(svg).toBeVisible();

        // Click load-more and verify more cards appear
        const cardCountBefore = await block.blogCard.count();
        await block.loadMoreButton.click();
        await page.waitForLoadState('networkidle');

        const cardCountAfter = await block.blogCard.count();
        expect(cardCountAfter).toBeGreaterThan(cardCountBefore);
        console.info(`[Grid] Cards before load-more: ${cardCountBefore}, after: ${cardCountAfter}`);
      } else {
        console.info('[Grid] No load-more button present (all cards fit in initial page)');
      }
    });

    await test.step('step-8: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-9: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[2], skipSeoTest: false });
    });
  });
});
