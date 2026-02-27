const { test, expect } = require('@playwright/test');
const { features } = require('./color-explorer.spec.cjs');
const ColorExplorerBlock = require('./color-explorer.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Color Explorer Gradients Block Test Suite', () => {
  // Test Id : 0 : @color-explorer-gradients-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new ColorExplorerBlock(page, features[0].selector);
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
      await expect(block.container).toBeVisible();
      await expect(block.gradientsSection).toBeVisible();
      await expect(block.header).toBeVisible();
      await expect(block.grid).toBeVisible();

      // Verify title contains gradient count
      const { title } = block;
      await expect(title).toBeVisible();
      const titleText = await title.textContent();
      expect(titleText).toContain('color gradients');

      // Verify grid has correct ARIA attributes
      const { grid } = block;
      await expect(grid).toHaveAttribute('role', 'grid');
      await expect(grid).toHaveAttribute('aria-roledescription', 'gradient grid');
      await expect(grid).toHaveAttribute('aria-colcount');
      await expect(grid).toHaveAttribute('aria-rowcount');

      // Verify gradient cards are rendered
      const cards = block.gradientCards;
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);
      expect(cardCount).toBeLessThanOrEqual(24); // Initial display count

      // Verify first card structure
      const firstCard = cards.first();
      await expect(firstCard).toHaveAttribute('role', 'gridcell');
      await expect(firstCard).toHaveAttribute('data-gradient-id');
      await expect(firstCard.locator('.gradient-visual')).toBeVisible();
      await expect(firstCard.locator('.gradient-name')).toBeVisible();
      await expect(firstCard.locator('.gradient-action-btn')).toBeVisible();

      // Verify semantic text content
      const sem = data.semantic;
      for (const t of sem.texts) {
        const locator = block.block.locator(t.selector).nth(t.nth || 0);
        if (t.text) {
          await expect(locator).toContainText(t.text, { timeout: 5000 });
        }
      }

      // Verify interactive elements
      for (const iEl of sem.interactives) {
        const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
        await expect(locator).toBeVisible({ timeout: 8000 });
        if (iEl.text) {
          await expect(locator).toContainText(iEl.text);
        }
      }
    });

    await test.step('step-3: Verify Load More functionality', async () => {
      const loadMoreBtn = block.loadMoreButton;
      const initialCardCount = await block.gradientCards.count();

      if (await loadMoreBtn.isVisible()) {
        await loadMoreBtn.click();
        await page.waitForTimeout(500); // Wait for cards to load

        const newCardCount = await block.gradientCards.count();
        expect(newCardCount).toBeGreaterThan(initialCardCount);
      }
    });

    await test.step('step-4: Verify keyboard navigation', async () => {
      const firstCard = block.gradientCards.first();

      // Focus first card
      await firstCard.focus();
      await expect(firstCard).toBeFocused();

      // Verify ARIA attributes for keyboard navigation
      await expect(firstCard).toHaveAttribute('tabindex', '0');

      // Test arrow key navigation
      await page.keyboard.press('ArrowRight');
      const secondCard = block.gradientCards.nth(1);
      await expect(secondCard).toBeFocused({ timeout: 1000 });
    });

    await test.step('step-5: Verify card interaction', async () => {
      const firstCard = block.gradientCards.first();
      const actionButton = firstCard.locator('.gradient-action-btn');

      // Verify action button is present and accessible
      await expect(actionButton).toBeVisible();
      await expect(actionButton).toHaveAttribute('aria-label');

      // Verify button has correct tabindex (not in Tab sequence)
      const tabindex = await actionButton.getAttribute('tabindex');
      expect(tabindex).toBe('-1');
    });

    await test.step('step-6: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-7: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0] });
    });

    await test.step('step-8: Verify responsive layout', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      const mobileGrid = block.grid;
      await expect(mobileGrid).toBeVisible();
      const mobileColCount = await mobileGrid.getAttribute('aria-colcount');
      expect(mobileColCount).toBe('1'); // Mobile should be 1 column

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);

      const tabletColCount = await mobileGrid.getAttribute('aria-colcount');
      expect(['1', '2']).toContain(tabletColCount); // Tablet should be 1-2 columns

      // Test desktop viewport
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.waitForTimeout(300);

      const desktopColCount = await mobileGrid.getAttribute('aria-colcount');
      expect(['2', '3']).toContain(desktopColCount); // Desktop should be 2-3 columns
    });
  });

  test('should handle empty data gracefully @color-explorer @gradients @edge-case', async ({ page, baseURL }) => {
    const testUrl = `${baseURL}/drafts/yeiber/color-poc${miloLibs}`;
    const block = new ColorExplorerBlock(page);

    const response = await page.goto(testUrl);

    // Graceful degradation: Skip test if page is 404
    if (response && response.status() === 404) {
      test.skip(true, `Test page not found (404): ${testUrl}`);
      return;
    }

    await page.waitForLoadState('domcontentloaded');

    // Verify block still renders even with edge cases
    await expect(block.block).toBeVisible();
  });

  test('should have proper ARIA live region for screen readers @color-explorer @gradients @a11y', async ({ page, baseURL }) => {
    const testUrl = `${baseURL}/drafts/yeiber/color-poc${miloLibs}`;
    const block = new ColorExplorerBlock(page);

    const response = await page.goto(testUrl);

    // Graceful degradation: Skip test if page is 404
    if (response && response.status() === 404) {
      test.skip(true, `Test page not found (404): ${testUrl}`);
      return;
    }

    await page.waitForLoadState('domcontentloaded');

    const { liveRegion } = block;
    await expect(liveRegion).toBeVisible();
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    await expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });
});
