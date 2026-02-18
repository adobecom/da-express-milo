const { test, expect } = require('@playwright/test');
const { features } = require('./template-x-carousel.spec.cjs');
const TemplateXCarouselBlock = require('./template-x-carousel.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Template X Carousel block tests', () => {
  // TCID 0: Default variant
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags.join(' ')}`, async ({ page, baseURL }) => {
    const feature = features[0];
    const { data } = feature;
    const testUrl = `${baseURL}${feature.path}${miloLibs}`;
    const block = new TemplateXCarouselBlock(page, feature.selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to test page', async () => {
      await block.goto(testUrl);
      await block.waitForBlockReady();
      await expect(block.block).toBeVisible();
    });

    await test.step('step-2: Verify block structure (heading, description, toolbar)', async () => {
      await expect(block.headersContainer).toBeVisible();
      await expect(block.heading).toBeVisible();
      await expect(block.heading).toContainText(data.heading);
      await expect(block.description).toBeVisible();
      await expect(block.description).toContainText(data.description);
      await expect(block.toolbar).toBeVisible();
    });

    await test.step('step-3: Verify templates are loaded', async () => {
      await block.waitForTemplates();
      const templateCount = await block.templates.count();
      expect(templateCount).toBeGreaterThan(0);
      console.info(`[Templates loaded]: ${templateCount}`);

      // Verify templates container has gallery attributes
      await expect(block.templatesContainer).toHaveClass(/gallery/);
      await expect(block.templatesContainer).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(block.templatesContainer).toHaveAttribute('role', 'group');
    });

    await test.step('step-4: Verify gallery carousel controls', async () => {
      await expect(block.galleryControl).toBeAttached();
      await expect(block.prevButton).toBeAttached();
      await expect(block.nextButton).toBeAttached();

      // Verify prev/next buttons have accessible labels
      await expect(block.prevButton).toHaveAttribute('aria-label', /prev/i);
      await expect(block.nextButton).toHaveAttribute('aria-label', /next/i);
    });

    await test.step('step-5: Test gallery next/prev navigation', async () => {
      const nextVisible = await block.nextButton.isVisible();
      if (nextVisible) {
        const nextDisabled = await block.nextButton.isDisabled();
        if (!nextDisabled) {
          await block.nextButton.click();
          // Allow scroll animation to settle
          await page.waitForTimeout(500);
          console.info('[Gallery]: Next button clicked');
        }

        const prevDisabled = await block.prevButton.isDisabled();
        if (!prevDisabled) {
          await block.prevButton.click();
          await page.waitForTimeout(500);
          console.info('[Gallery]: Prev button clicked');
        }
      }
    });

    await test.step('step-6: Verify View All link', async () => {
      await expect(block.viewAllLink).toBeVisible();
      await expect(block.viewAllLink).toContainText(data.viewAllText);
      const href = await block.viewAllLink.getAttribute('href');
      expect(href).toBeTruthy();

      // Verify chevron icon inside View All link
      const chevronIcon = block.viewAllLink.locator('img.icon');
      await expect(chevronIcon).toBeAttached();
    });

    await test.step('step-7: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block });
    });

    await test.step('step-8: SEO validation', async () => {
      await runSeoChecks({ page, feature });
    });
  });
});
