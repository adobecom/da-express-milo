const { test, expect } = require('@playwright/test');
const { features } = require('./font-generator.spec.cjs');
const FontGeneratorBlock = require('./font-generator.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('FontGeneratorBlock Test Suite', () => {
  // Test Id : 0 : @font-generator-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new FontGeneratorBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      // The block may sync non-default state to the URL on load (e.g. a
      // responsive ?view=list on small viewports), so match the base path
      // and ignore any query string it appends.
      await expect(page).toHaveURL(new RegExp(`^${testUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\?.*)?$`));
    });

    await test.step('step-2: Verify block structure', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.grid).toBeVisible();
      await expect(block.sideCol).toBeVisible();
      await expect(block.mainCol).toBeVisible();
    });

    await test.step('step-3: Verify text input renders', async () => {
      await expect(block.textInput).toBeVisible();
      await expect(block.textarea).toBeVisible();
    });

    await test.step('step-4: Verify toolbar renders', async () => {
      await expect(block.toolbar).toBeVisible();
      await expect(block.count).toBeVisible();
    });

    await test.step('step-5: Verify font card grid renders', async () => {
      await expect(block.fontCardGrid).toBeVisible();
      await expect(block.fontCards.first()).toBeVisible();
    });

    // The filters have two interaction models: below 1200px they live in a
    // drawer opened by the toolbar's filter trigger; at >=1200px they render
    // inline in the sticky sidebar and the trigger is hidden.
    await test.step('step-6: Filters are reachable for the current viewport', async () => {
      if (await block.filterTrigger.isVisible()) {
        await block.filterTrigger.click();
        await expect(block.filterPanel).toBeVisible();
        await expect(block.filterPanelClose).toBeVisible();
        await block.filterPanelClose.click();
        await expect(block.filterPanel).not.toBeVisible();
      } else {
        await expect(block.desktopFilters).toBeVisible();
      }
    });

    await test.step('step-7: Selecting a category filters the card grid', async () => {
      // The grid paginates (INITIAL_VISIBLE_COUNT cards at a time), so the
      // rendered card count is capped and does not shrink on filter. The
      // toolbar count reflects the full active (filtered) font set, so assert
      // against that instead — it drops from the whole catalog to the subset.
      const readCount = async () => {
        const text = (await block.count.textContent()) ?? '';
        return Number(text.match(/\d+/)?.[0] ?? NaN);
      };
      const totalCount = await readCount();
      // Opening the drawer (mobile) is required before its buttons are visible.
      if (await block.filterTrigger.isVisible()) await block.filterTrigger.click();
      await block.categoryFilter('Glitch').first().click();
      await expect(async () => {
        expect(await readCount()).toBeLessThan(totalCount);
      }).toPass();
    });

    await test.step('step-8: Typing in textarea updates font card previews', async () => {
      // Every card renders the preview through a Unicode transform, so the
      // preview never contains the raw typed string (e.g. "Hello" becomes
      // "Ⓗⓔⓛⓛⓞ"). Assert the preview re-renders — its text must change from
      // the prior sample once new input is typed.
      const preview = block.fontCards.first().locator('.font-card-preview');
      const before = (await preview.textContent()) ?? '';
      await block.textarea.fill('Hello world');
      await expect(preview).not.toHaveText(before);
    });

    await test.step('step-9: Toolbar layout buttons are a single tab stop with arrow-key nav', async () => {
      // The grid/list toggle is hidden below 600px (see toolbar.css) — only
      // meaningful to test on viewports where it's actually shown.
      if (!(await block.layoutGroup.isVisible())) return;
      await block.gridButton.focus();
      await expect(block.gridButton).toBeFocused();
      await expect(block.listButton).not.toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(block.listButton).toBeFocused();
    });

    await test.step('step-10: Suggestion pills are a single tab stop with arrow-key nav', async () => {
      const pills = block.suggestionPills;
      await expect(block.suggestionsToolbar).toHaveAttribute('role', 'toolbar');
      await pills.first().focus();
      await expect(pills.first()).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(pills.nth(1)).toBeFocused();
      await page.keyboard.press('Home');
      await expect(pills.first()).toBeFocused();
    });

    await test.step('step-11: Font card grid — arrow keys move between cells, Enter/Escape enter and exit', async () => {
      const firstCard = block.fontCards.first();
      const secondCard = block.fontCards.nth(1);
      const copyBtn = block.cardCopyBtnAt(0);

      await firstCard.focus();
      await expect(firstCard).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(secondCard).toBeFocused();
      await page.keyboard.press('ArrowLeft');
      await expect(firstCard).toBeFocused();

      // Enter "enters" the cell — focus moves to its first interactive child.
      await page.keyboard.press('Enter');
      await expect(copyBtn).toBeFocused();

      // Escape exits back to the cell wrapper; arrow nav resumes from there.
      await page.keyboard.press('Escape');
      await expect(firstCard).toBeFocused();
    });

    await test.step('step-12: Tab past the last interactive child in an entered cell exits back to the cell', async () => {
      const firstCard = block.fontCards.first();
      const copyBtn = block.cardCopyBtnAt(0);
      const cta = block.cardCtaAt(0);

      await firstCard.focus();
      await page.keyboard.press('Enter');
      await expect(copyBtn).toBeFocused();

      if (await cta.count()) {
        await page.keyboard.press('Tab');
        await expect(cta).toBeFocused();
        await page.keyboard.press('Tab');
      } else {
        await page.keyboard.press('Tab');
      }
      await expect(firstCard).toBeFocused();
    });

    await test.step('step-13: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-14: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
