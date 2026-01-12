/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './template-x-carousel-toolbar.spec.cjs';
import TemplateXCarouselToolbar from './template-x-carousel-toolbar.page.cjs';

let toolbarCarousel;

test.describe('Template X Carousel Toolbar block tests', () => {
  test.beforeEach(async ({ page }) => {
    toolbarCarousel = new TemplateXCarouselToolbar(page);
  });

  // TCID 0: Basic display
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      await toolbarCarousel.gotoURL(testPage);
      await toolbarCarousel.page.waitForLoadState('networkidle');
      await toolbarCarousel.page.waitForTimeout(3000);
    });

    await test.step('Verify block is loaded', async () => {
      await expect(toolbarCarousel.block).toBeVisible();
      console.log('✅ Template-x-carousel-toolbar block visible');
    });

    await test.step('Verify toolbar is present', async () => {
      await expect(toolbarCarousel.toolbar).toBeVisible();
      console.log('✅ Toolbar visible');
    });

    await test.step('Verify templates are loaded', async () => {
      const count = await toolbarCarousel.getTemplateCount();
      console.log(`Found ${count} templates`);
      expect(count).toBeGreaterThan(0);
    });
  });

  // TCID 1: Category filtering
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate and load', async () => {
      await toolbarCarousel.gotoURL(testPage);
      await toolbarCarousel.page.waitForLoadState('networkidle');
      await toolbarCarousel.page.waitForTimeout(3000);
    });

    await test.step('Test category buttons', async () => {
      const categoryCount = await toolbarCarousel.getCategoryCount();
      console.log(`Found ${categoryCount} category buttons`);

      if (categoryCount > 0) {
        const firstCategory = toolbarCarousel.categoryButtons.first();
        const categoryText = await firstCategory.textContent();
        await firstCategory.click();
        await toolbarCarousel.page.waitForTimeout(1000);
        console.log(`✅ Category "${categoryText}" clicked`);
      }
    });

    await test.step('Test search functionality', async () => {
      if (await toolbarCarousel.searchInput.isVisible()) {
        await toolbarCarousel.searchTemplates('logo');
        await toolbarCarousel.page.waitForTimeout(2000);
        console.log('✅ Search tested');
      }
    });
  });

  // TCID 2: Carousel navigation
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[2].path}`);
    const testPage = `${baseURL}${features[2].path}`;

    await test.step('Navigate and load', async () => {
      await toolbarCarousel.gotoURL(testPage);
      await toolbarCarousel.page.waitForLoadState('networkidle');
      await toolbarCarousel.page.waitForTimeout(3000);
    });

    await test.step('Test carousel navigation', async () => {
      if (await toolbarCarousel.nextButton.isVisible()) {
        await toolbarCarousel.clickNext();
        await toolbarCarousel.page.waitForTimeout(500);
        console.log('✅ Next button clicked');

        if (await toolbarCarousel.prevButton.isVisible()) {
          await toolbarCarousel.clickPrev();
          await toolbarCarousel.page.waitForTimeout(500);
          console.log('✅ Prev button clicked');
        }
      }
    });

    await test.step('Test keyboard navigation', async () => {
      await toolbarCarousel.carousel.focus();
      await toolbarCarousel.page.keyboard.press('ArrowRight');
      await toolbarCarousel.page.waitForTimeout(500);
      console.log('✅ Arrow key navigation tested');
    });
  });

  // TCID 3: Sticky toolbar
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[3].path}`);
    const testPage = `${baseURL}${features[3].path}`;

    await test.step('Navigate and load', async () => {
      await toolbarCarousel.gotoURL(testPage);
      await toolbarCarousel.page.waitForLoadState('networkidle');
      await toolbarCarousel.page.waitForTimeout(3000);
    });

    await test.step('Test sticky toolbar behavior', async () => {
      const isSticky = await toolbarCarousel.isToolbarSticky();
      console.log(`Toolbar sticky: ${isSticky}`);

      await toolbarCarousel.page.evaluate(() => window.scrollTo(0, 500));
      await toolbarCarousel.page.waitForTimeout(500);

      const toolbarVisible = await toolbarCarousel.toolbar.isVisible();
      console.log(`Toolbar visible after scroll: ${toolbarVisible}`);
      expect(toolbarVisible).toBe(true);
    });

    await test.step('Test toolbar title', async () => {
      const title = await toolbarCarousel.getToolbarTitle();
      console.log(`Toolbar title: ${title}`);
      expect(title).toBeTruthy();
    });
  });
});
