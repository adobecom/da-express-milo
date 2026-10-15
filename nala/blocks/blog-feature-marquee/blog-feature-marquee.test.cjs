const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./blog-feature-marquee.spec.cjs');
const BlogFeatureMarqueeBlock = require('./blog-feature-marquee.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('BlogFeatureMarqueeBlock Test Suite', () => {
  // Test Id : 0 : @blog-feature-marquee-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new BlogFeatureMarqueeBlock(page, features[0].selector);
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

    await test.step('step-2: Verify block content', async () => {
      const blockCount = await block.block.count();
      if (blockCount === 0) {
        test.skip(true, `Block not found on page: ${features[0].selector}`);
        return;
      }

      // Wait for async decoration (blog index fetch) to complete
      await expect(block.block).toHaveClass(/blog-feature-marquee-ready/, { timeout: 15000 });
      await expect(block.block).toBeVisible();
      const sem = data.semantic;

      for (const t of sem.texts || []) {
        const locator = block.block.locator(t.selector).nth(t.nth || 0);
        await expect(locator).toContainText(t.text);
      }

      // Cards come from the live blog index, so assert structure and ordering rather than exact content
      if (sem.cards) {
        const cards = block.block.locator(sem.cards.selector);
        await expect(cards.nth((sem.cards.minCount || 1) - 1)).toBeAttached();
        const cardCount = await cards.count();
        const hrefPattern = new RegExp(sem.cards.hrefPattern);
        const dates = [];

        for (let i = 0; i < cardCount; i += 1) {
          const card = cards.nth(i);
          await expect(card.locator(sem.cards.titleSelector)).toHaveText(/\S/);
          const href = await card.getAttribute('href');
          expect(new URL(href, 'https://dummy.base').pathname).toMatch(hrefPattern);

          const dateLocator = card.locator(sem.cards.dateSelector);
          if (await dateLocator.count()) {
            const timestamp = Date.parse(await dateLocator.textContent());
            expect(timestamp, `card ${i} date should be parseable`).not.toBeNaN();
            dates.push(timestamp);
          }
        }

        if (sem.cards.sortedByDateDesc) {
          expect(dates.length, 'at least one card should show a date').toBeGreaterThan(0);
          for (let i = 1; i < dates.length; i += 1) {
            expect(dates[i], `card dates should be sorted newest first (index ${i})`).toBeLessThanOrEqual(dates[i - 1]);
          }
        }
      }

      for (const m of sem.media || []) {
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

      for (const iEl of sem.interactives || []) {
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
});
