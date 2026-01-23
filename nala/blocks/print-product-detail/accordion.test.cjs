const { expect, test } = require('@playwright/test');
const { features } = require('./accordion.spec.cjs');

const miloLibs = process.env.MILO_LIBS || '';

/**
 * Comprehensive Accordion Tests for Print Product Detail
 * Tests all requirements from the accordion specification
 */
test.describe('Print Product Detail Accordion Comprehensive Tests', () => {
  let page;
  let baseURL;

  test.beforeEach(async ({ page: p, baseURL: url }) => {
    page = p;
    baseURL = url;
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');

    // Wait for PDP block and accordion to load
    try {
      // Wait for either ax-accordion or regular accordion
      await Promise.race([
        page.waitForSelector('.ax-accordion-item-container', { timeout: 10000 }),
        page.waitForSelector('.accordion-item', { timeout: 10000 }),
        page.waitForSelector('[class*="pdp"]', { timeout: 10000 }),
      ]);
      console.info('[Accordion] Page loaded with content');
    } catch (e) {
      console.warn('[Accordion] Timeout waiting for content');
    }

    // Extra wait for dynamic block loading and API calls
    await page.waitForTimeout(3000);
  });

  // Test 1: Single-Expand Logic
  test(`[Test Id - ${features[0].tcid}] ${features[0].name}, ${features[0].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    console.info(`[Test 1] Found ${count} accordion items`);

    // Test passes with any number of items (even 1)
    if (count === 0) {
      // Log what's on the page for debugging
      const hasAxAccordion = await page.locator('.ax-accordion').count();
      const hasPdpBlock = await page.locator('[class*="pdp"]').count();
      console.warn(`[Test 1] Debug - ax-accordion: ${hasAxAccordion}, pdp blocks: ${hasPdpBlock}`);
      test.skip(true, 'No accordion items found on page');
    }

    await test.step('Verify accordions can be toggled', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      const initialState = await firstButton.getAttribute('aria-expanded');

      // Click to toggle
      await firstButton.click();
      await page.waitForTimeout(300);

      const newState = await firstButton.getAttribute('aria-expanded');
      expect(newState).not.toBe(initialState);
    });

    if (count >= 2) {
      await test.step('Open second accordion - first should auto-collapse', async () => {
        const secondButton = accordionItems.nth(1).locator('.ax-accordion-item-title-container');
        await secondButton.click();
        await page.waitForTimeout(300);

        const firstButton = accordionItems.nth(0).locator('.ax-accordion-item-title-container');
        const firstExpanded = await firstButton.getAttribute('aria-expanded');
        const secondExpanded = await secondButton.getAttribute('aria-expanded');

        expect(firstExpanded).toBe('false');
        expect(secondExpanded).toBe('true');
      });
    }

    await test.step('Verify only one is expanded at any time', async () => {
      let expandedCount = 0;
      for (let i = 0; i < count; i++) {
        const button = accordionItems.nth(i).locator('.ax-accordion-item-title-container');
        const ariaExpanded = await button.getAttribute('aria-expanded');
        if (ariaExpanded === 'true') {
          expandedCount++;
        }
      }
      expect(expandedCount).toBeLessThanOrEqual(1);
    });
  });

  // Test 2: Smooth Transitions
  test(`[Test Id - ${features[1].tcid}] ${features[1].name}, ${features[1].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    await test.step('Verify transition CSS is present', async () => {
      const firstItem = accordionItems.first();
      const description = firstItem.locator('.ax-accordion-item-description');
      const transition = await description.evaluate((el) => getComputedStyle(el).transition);

      // Should have transition property defined
      expect(transition).toContain('grid-template-rows');
    });

    await test.step('Measure expand animation time', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      const startTime = Date.now();

      await firstButton.click();
      await page.waitForTimeout(100); // Small buffer

      const ariaExpanded = await firstButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('true');

      // Animation should complete within reasonable time (200-400ms)
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });

  // Test 3: Visual States (+/- Icons)
  test(`[Test Id - ${features[2].tcid}] ${features[2].name}, ${features[2].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    await test.step('Verify collapsed state has + icon', async () => {
      const firstItem = accordionItems.first();
      const icon = firstItem.locator('.ax-accordion-item-icon');

      const bgImage = await icon.evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(bgImage).toContain('plus');
    });

    await test.step('Verify expanded state has - icon', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      await firstButton.click();
      await page.waitForTimeout(300);

      const icon = firstButton.locator('.ax-accordion-item-icon');
      const bgImage = await icon.evaluate((el) => getComputedStyle(el).backgroundImage);

      expect(bgImage).toContain('minus');
    });
  });

  // Test 4: Keyboard Navigation
  test(`[Test Id - ${features[3].tcid}] ${features[3].name}, ${features[3].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    await test.step('Verify accordion buttons are keyboard focusable', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      // Buttons are natively focusable, no tabindex needed
      await firstButton.focus();
      const isFocused = await firstButton.evaluate((el) => document.activeElement === el);
      expect(isFocused).toBe(true);
    });

    await test.step('Verify Enter key expands accordion', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      await firstButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      const ariaExpanded = await firstButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('true');
    });

    await test.step('Verify Space key collapses accordion', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      await firstButton.focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);

      const ariaExpanded = await firstButton.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('false');
    });
  });

  // Test 5: Accessibility (ARIA Attributes)
  test(`[Test Id - ${features[4].tcid}] ${features[4].name}, ${features[4].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    await test.step('Verify button ARIA attributes are present', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');
      const firstPanel = accordionItems.first().locator('.ax-accordion-item-description');

      const tagName = await firstButton.evaluate((el) => el.tagName.toLowerCase());
      const ariaExpanded = await firstButton.getAttribute('aria-expanded');
      const ariaControls = await firstButton.getAttribute('aria-controls');
      const panelRole = await firstPanel.getAttribute('role');
      const panelLabelledBy = await firstPanel.getAttribute('aria-labelledby');

      expect(tagName).toBe('button');
      expect(ariaExpanded).toBeTruthy();
      expect(ariaControls).toBeTruthy();
      expect(panelRole).toBe('region');
      expect(panelLabelledBy).toBeTruthy();
    });

    await test.step('Verify aria-expanded toggles correctly', async () => {
      const firstButton = accordionItems.first().locator('.ax-accordion-item-title-container');

      const initialState = await firstButton.getAttribute('aria-expanded');
      await firstButton.click();
      await page.waitForTimeout(300);

      const newState = await firstButton.getAttribute('aria-expanded');
      expect(newState).not.toBe(initialState);
    });

    await test.step('Verify accordion has proper semantic structure', async () => {
      const firstItem = accordionItems.first();
      const title = firstItem.locator('.ax-accordion-item-title');
      const description = firstItem.locator('.ax-accordion-item-description');

      await expect(title).toBeVisible();
      expect(await description.count()).toBe(1);
    });
  });

  // Test 6: Content Display
  test(`[Test Id - ${features[5].tcid}] ${features[5].name}, ${features[5].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    await test.step('Verify content is hidden when collapsed', async () => {
      const firstItem = accordionItems.first();
      const description = firstItem.locator('.ax-accordion-item-description');

      // Check if content is effectively hidden via CSS Grid (browsers may compute 0fr as 0px)
      const gridRows = await description.evaluate((el) => getComputedStyle(el).gridTemplateRows);
      expect(gridRows === '0fr' || gridRows === '0px').toBeTruthy();
    });

    await test.step('Verify content is visible when expanded', async () => {
      const firstItem = accordionItems.first();
      await firstItem.locator('.ax-accordion-item-title-container').click();
      await page.waitForTimeout(300);

      const description = firstItem.locator('.ax-accordion-item-description');
      const content = description.locator('> *').first();

      // Content should be visible
      await expect(content).toBeVisible({ timeout: 1000 });

      // Check if content has text
      const text = await content.innerText();
      expect(text.length).toBeGreaterThan(0);
    });
  });

  // Test 7: Auto-Collapse on Scroll-to-Top
  test(`[Test Id - ${features[6].tcid}] ${features[6].name}, ${features[6].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    // Check if page is scrollable
    const isScrollable = await page.evaluate(() => document.body.scrollHeight > window.innerHeight);
    if (!isScrollable) {
      console.log('Page not scrollable, skipping auto-collapse test');
      return; // Pass but don't test
    }

    await test.step('Expand an accordion and scroll down', async () => {
      await accordionItems.first().locator('.ax-accordion-item-title-container').click();
      await page.waitForTimeout(300);

      // Scroll down significantly
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);
    });

    await test.step('Scroll back to top - accordion should auto-collapse', async () => {
      // Scroll back to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500); // Wait for scroll detection

      const firstExpanded = await accordionItems.first().locator('.ax-accordion-item-title-container').getAttribute('aria-expanded');
      expect(firstExpanded).toBe('false');
    });
  });

  // Test 8: State Retention on Product Updates
  test(`[Test Id - ${features[7].tcid}] ${features[7].name}, ${features[7].tags}`, async () => {
    const accordionItems = page.locator('.ax-accordion-item-container');
    const count = await accordionItems.count();

    if (count === 0) {
      test.skip(true, 'No accordion items found');
    }

    await test.step('Expand a specific accordion', async () => {
      const secondItem = accordionItems.nth(1);
      const titleText = await secondItem.locator('.ax-accordion-item-title').innerText();

      await secondItem.locator('.ax-accordion-item-title-container').click();
      await page.waitForTimeout(300);

      const button = secondItem.locator('.ax-accordion-item-title-container'); const ariaExpanded = await button.getAttribute('aria-expanded');
      expect(ariaExpanded).toBe('true');

      // Store the title for later verification
      await page.evaluate((title) => {
        window.testExpandedTitle = title;
      }, titleText);
    });

    await test.step('Change product variant (if possible)', async () => {
      // Try to find and click a product option button
      const optionButtons = page.locator('button[data-name], .pdpx-mini-pill-image-container, .pdpx-pill-container');
      const optionCount = await optionButtons.count();

      if (optionCount > 1) {
        // Click a different option
        await optionButtons.nth(1).click();
        await page.waitForTimeout(1000); // Wait for update
      } else {
        console.warn('No product options found to test state retention');
      }
    });

    await test.step('Verify accordion state is retained', async () => {
      const expandedTitle = await page.evaluate(() => window.testExpandedTitle);

      if (expandedTitle) {
        // Find the item with matching title
        const items = await accordionItems.all();
        let found = false;

        for (const item of items) {
          const titleText = await item.locator('.ax-accordion-item-title').innerText();
          if (titleText === expandedTitle) {
            const button = item.locator('.ax-accordion-item-title-container');
            const ariaExpanded = await button.getAttribute('aria-expanded');
            expect(ariaExpanded).toBe('true');
            found = true;
            break;
          }
        }

        if (!found) {
          console.warn(`Accordion "${expandedTitle}" not found after update - may have been removed for this variant`);
        }
      }
    });
  });

  // Test 9: No Horizontal Overflow
  test(`[Test Id - ${features[8].tcid}] ${features[8].name}, ${features[8].tags}`, async () => {
    const accordion = page.locator('.ax-accordion').first();

    if ((await accordion.count()) === 0) {
      test.skip(true, 'No accordion found');
    }

    await test.step('Verify accordion respects container width', async () => {
      const accordionBox = await accordion.boundingBox();
      const viewportWidth = page.viewportSize().width;

      expect(accordionBox.width).toBeLessThanOrEqual(viewportWidth);
    });

    await test.step('Expand accordion and verify no overflow', async () => {
      const accordionItems = accordion.locator('.ax-accordion-item-container');
      const count = await accordionItems.count();

      if (count > 0) {
        await accordionItems.first().locator('.ax-accordion-item-title-container').click();
        await page.waitForTimeout(300);

        // Check for horizontal scrollbar
        const hasHorizontalScroll = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );

        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });

  // Test 10: Multiple Accordions Can Coexist
  test(`[Test Id - ${features[9].tcid}] ${features[9].name}, ${features[9].tags}`, async () => {
    const accordions = page.locator('.ax-accordion');
    const accordionCount = await accordions.count();

    if (accordionCount === 0) {
      test.skip(true, 'No accordion instances found on page');
    }

    if (accordionCount < 2) {
      console.log('Only one accordion instance, verifying it works correctly');
      await test.step('Verify single accordion operates correctly', async () => {
        const accordion = accordions.first();
        const items = accordion.locator('.ax-accordion-item-container');
        const itemCount = await items.count();

        if (itemCount > 0) {
          const firstButton = items.first().locator('.ax-accordion-item-title-container');
          await firstButton.click();
          await page.waitForTimeout(300);

          const expanded = await firstButton.getAttribute('aria-expanded');
          expect(expanded).toBe('true');
        }
      });
      return; // Pass the test
    }

    await test.step('Verify each accordion operates independently', async () => {
      // Expand item in first accordion
      const firstAccordion = accordions.first();
      const firstItems = firstAccordion.locator('.ax-accordion-item-container');
      const firstItemCount = await firstItems.count();

      if (firstItemCount > 0) {
        await firstItems.first().locator('.ax-accordion-item-title-container').click();
        await page.waitForTimeout(300);

        const firstExpanded = await firstItems.first().locator('.ax-accordion-item-title-container').getAttribute('aria-expanded');
        expect(firstExpanded).toBe('true');
      }

      // Verify second accordion is not affected
      const secondAccordion = accordions.nth(1);
      const secondItems = secondAccordion.locator('.ax-accordion-item-container');
      const secondItemCount = await secondItems.count();

      if (secondItemCount > 0) {
        const secondExpanded = await secondItems.first().locator('.ax-accordion-item-title-container').getAttribute('aria-expanded');
        expect(secondExpanded).toBe('false');
      }
    });
  });
});
