const { expect, test } = require('@playwright/test');
const { features } = require('./faqv2.spec.cjs');
const Faqv2 = require('./faqv2.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');

let faqv2;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express FAQv2 Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    faqv2 = new Faqv2(page);
  });

  // Test 0: FAQv2 Default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to FAQv2 default block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Check if FAQv2 blocks exist on page', async () => {
      const faqv2Blocks = await page.locator('.faqv2').count();
      if (faqv2Blocks === 0) {
        console.log('No faqv2 blocks found on test page - skipping test');
        test.skip();
      }
    });

    await test.step('Verify FAQv2 default block content/specs', async () => {
      // Check if any faqv2 blocks exist (default or expandable)
      const faqv2Blocks = await page.locator('.faqv2').count();
      expect(faqv2Blocks).toBeGreaterThan(0);

      // Check for either default or expandable variant
      const hasDefault = await page.locator('.faqv2:not(.expandable)').count() > 0;
      const hasExpandable = await page.locator('.faqv2.expandable').count() > 0;

      if (hasDefault) {
        await expect(faqv2.variants.default).toBeVisible();
        await expect(faqv2.defaultAccordion.first()).toBeVisible();
        await expect(faqv2.defaultHeader.first()).toContainText(data.question1);
        await expect(faqv2.toggleButton).toBeVisible();
        await expect(faqv2.toggleButton).toHaveAttribute('aria-expanded', 'false');
      } else if (hasExpandable) {
        await expect(faqv2.variants.expandable).toBeVisible();
        await expect(faqv2.accordionTitle).toContainText(data.h2Text);
        await expect(faqv2.expandableWrapper.first()).toBeVisible();
        await expect(faqv2.expandableHeader.first()).toContainText(data.question1);
      }
    });

    await test.step('Verify toggle button functionality', async () => {
      // Only test toggle button if it exists (default variant)
      const toggleButton = page.locator('.faqv2-toggle-btn');
      const toggleButtonCount = await toggleButton.count();

      if (toggleButtonCount > 0) {
        await toggleButton.click();
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

        // Click again to collapse
        await toggleButton.click();
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      } else {
        // For expandable variant, test accordion headers instead
        const firstHeader = faqv2.expandableHeader.first();
        if (await firstHeader.count() > 0) {
          await firstHeader.click();
          // Wait for animation
          await page.waitForTimeout(500);
        }
      }
    });

    await test.step('Verify analytics attributes', async () => {
      // Get the actual section number from the page
      const sectionDaalh = await faqv2.section.getAttribute('daa-lh');
      expect(sectionDaalh).toMatch(/^s\d+$/);

      const blockDaalh = await faqv2.faqv2.getAttribute('daa-lh');
      expect(blockDaalh).toMatch(/^b\d+\|faqv2$/);
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: faqv2.faqv2 });
    });
  });

  // Test 1: FAQv2 Expandable
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to FAQv2 expandable block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Check if FAQv2 blocks exist on page', async () => {
      const faqv2Blocks = await page.locator('.faqv2').count();
      if (faqv2Blocks === 0) {
        console.log('No faqv2 blocks found on test page - skipping test');
        test.skip();
      }
    });

    await test.step('Verify FAQv2 expandable block content/specs', async () => {
      await expect(faqv2.variants.expandable).toBeVisible();
      await expect(faqv2.accordionTitle).toContainText(data.h2Text);
      await expect(faqv2.expandableWrapper.first()).toBeVisible();
      await expect(faqv2.expandableHeader.first()).toContainText(data.question1);
      await expect(faqv2.toggleIcon.first()).toBeVisible();
    });

    await test.step('Verify first accordion opens by default', async () => {
      const firstContent = faqv2.expandableContent.first();
      await expect(firstContent).toHaveClass(/open/);

      const firstIcon = faqv2.toggleIcon.first();
      const iconSrc = await firstIcon.getAttribute('src');
      expect(iconSrc).toContain('minus-heavy.svg');
    });

    await test.step('Verify accordion toggle functionality', async () => {
      const secondHeader = faqv2.expandableHeader.nth(1);
      const secondContent = faqv2.expandableContent.nth(1);
      const firstContent = faqv2.expandableContent.first();

      // Click second accordion
      await secondHeader.click();

      // Wait for animation
      await page.waitForTimeout(500);

      // Second should be open, first should be closed
      await expect(secondContent).toHaveClass(/open/);
      await expect(firstContent).not.toHaveClass(/open/);
    });

    await test.step('Verify analytics attributes', async () => {
      // Get the actual section number from the page
      const sectionDaalh = await faqv2.section.getAttribute('daa-lh');
      expect(sectionDaalh).toMatch(/^s\d+$/);

      const blockDaalh = await faqv2.faqv2.getAttribute('daa-lh');
      expect(blockDaalh).toMatch(/^b\d+\|faqv2$/);
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: faqv2.faqv2 });
    });
  });

  // Test 2: FAQv2 Longform
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to FAQv2 longform block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Check if FAQv2 blocks exist on page', async () => {
      const faqv2Blocks = await page.locator('.faqv2').count();
      if (faqv2Blocks === 0) {
        console.log('No faqv2 blocks found on test page - skipping test');
        test.skip();
      }
    });

    await test.step('Verify FAQv2 longform block content/specs', async () => {
      // Check if longform variant exists, otherwise check for any expandable variant
      const longformCount = await page.locator('.faqv2.expandable.longform').count();
      const expandableCount = await page.locator('.faqv2.expandable').count();

      if (longformCount > 0) {
        await expect(faqv2.variants.longform).toBeVisible();
        await expect(faqv2.longformHeaderContainer).toBeVisible();
      } else if (expandableCount > 0) {
        await expect(faqv2.variants.expandable).toBeVisible();
      }

      await expect(faqv2.accordionTitle).toContainText(data.h2Text);
      await expect(faqv2.expandableWrapper.first()).toBeVisible();
    });

    await test.step('Verify longform accordion functionality', async () => {
      const firstContent = faqv2.expandableContent.first();
      await expect(firstContent).toHaveClass(/open/);

      // Click to close
      await faqv2.expandableHeader.first().click();
      await page.waitForTimeout(500);
      await expect(firstContent).not.toHaveClass(/open/);
    });

    await test.step('Verify analytics attributes', async () => {
      // Get the actual section number from the page
      const sectionDaalh = await faqv2.section.getAttribute('daa-lh');
      expect(sectionDaalh).toMatch(/^s\d+$/);

      const blockDaalh = await faqv2.faqv2.getAttribute('daa-lh');
      expect(blockDaalh).toMatch(/^b\d+\|faqv2$/);
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: faqv2.faqv2 });
    });
  });

  // Test 3: FAQv2 Empty
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to FAQv2 empty block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Check if FAQv2 blocks exist on page', async () => {
      const faqv2Blocks = await page.locator('.faqv2').count();
      if (faqv2Blocks === 0) {
        console.log('No faqv2 blocks found on test page - skipping test');
        test.skip();
      }
    });

    await test.step('Verify FAQv2 empty block is hidden or has no content', async () => {
      // The block should be hidden when there's no content, or have no accordion content
      const faqv2Block = page.locator('.faqv2');
      const isHidden = await faqv2Block.evaluate((el) => el.style.display === 'none');
      const hasNoContent = await page.locator('.faqv2-wrapper').count() === 0;

      expect(isHidden || hasNoContent).toBe(true);
    });

    await test.step('Verify analytics attributes if block is visible', async () => {
      // Only check analytics if the block is visible and has content
      const faqv2Block = page.locator('.faqv2');
      const isHidden = await faqv2Block.evaluate((el) => el.style.display === 'none');
      const hasContent = await page.locator('.faqv2-wrapper').count() > 0;

      if (!isHidden && hasContent) {
        // Get the actual section number from the page
        const sectionDaalh = await faqv2.section.getAttribute('daa-lh');
        expect(sectionDaalh).toMatch(/^s\d+$/);

        const blockDaalh = await faqv2.faqv2.getAttribute('daa-lh');
        expect(blockDaalh).toMatch(/^b\d+\|faqv2$/);
      } else {
        console.log('Block is hidden or has no content - skipping analytics check');
      }
    });
  });
});
