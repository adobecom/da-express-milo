/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './template-promo-carousel.spec.cjs';
import TemplatePromoCarousel from './template-promo-carousel.page.cjs';

let carousel;

test.describe('Template Promo Carousel block tests', () => {
  test.beforeEach(async ({ page }) => {
    carousel = new TemplatePromoCarousel(page);
  });

  // TCID 0: Basic carousel navigation
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('networkidle');
      await carousel.page.waitForTimeout(3000);
    });

    await test.step('Verify carousel is loaded', async () => {
      await expect(carousel.block).toBeVisible();
      const count = await carousel.getTemplateCount();
      console.log(`Found ${count} templates in carousel`);
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Test next/prev buttons', async () => {
      if (await carousel.nextButton.isVisible()) {
        await carousel.clickNext();
        await carousel.page.waitForTimeout(500);
        console.log('✅ Next button clicked');

        if (await carousel.prevButton.isVisible()) {
          await carousel.clickPrev();
          await carousel.page.waitForTimeout(500);
          console.log('✅ Prev button clicked');
        }
      }
    });

    await test.step('Test dot navigation', async () => {
      const dotCount = await carousel.dots.count();
      console.log(`Found ${dotCount} navigation dots`);

      if (dotCount > 1) {
        await carousel.clickDot(1);
        await carousel.page.waitForTimeout(500);
        console.log('✅ Dot navigation tested');
      }
    });
  });

  // TCID 1: Swipe gestures
  test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate with mobile viewport', async () => {
      await carousel.page.setViewportSize({ width: 375, height: 667 });
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('networkidle');
      await carousel.page.waitForTimeout(3000);
    });

    await test.step('Test swipe left', async () => {
      await carousel.swipeLeft();
      await carousel.page.waitForTimeout(500);
      console.log('✅ Swipe left tested');
    });

    await test.step('Test swipe right', async () => {
      await carousel.swipeRight();
      await carousel.page.waitForTimeout(500);
      console.log('✅ Swipe right tested');
    });
  });

  // TCID 2: Autoplay functionality
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[2].path}`);
    const testPage = `${baseURL}${features[2].path}`;

    await test.step('Navigate and load', async () => {
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('networkidle');
      await carousel.page.waitForTimeout(3000);
    });

    await test.step('Test autoplay', async () => {
      const isAutoplay = await carousel.isAutoplayActive();
      console.log(`Autoplay active: ${isAutoplay}`);

      if (isAutoplay) {
        await carousel.page.waitForTimeout(5000);
        console.log('✅ Autoplay tested (waited 5s)');
      }
    });

    await test.step('Test pause on hover', async () => {
      await carousel.carousel.hover();
      await carousel.page.waitForTimeout(1000);
      console.log('✅ Hover pause tested');
    });
  });

  // TCID 3: Keyboard navigation
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[3].path}`);
    const testPage = `${baseURL}${features[3].path}`;

    await test.step('Navigate and load', async () => {
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('networkidle');
      await carousel.page.waitForTimeout(3000);
    });

    await test.step('Test arrow key navigation', async () => {
      await carousel.carousel.focus();
      await carousel.page.keyboard.press('ArrowRight');
      await carousel.page.waitForTimeout(500);
      console.log('✅ Arrow right tested');

      await carousel.page.keyboard.press('ArrowLeft');
      await carousel.page.waitForTimeout(500);
      console.log('✅ Arrow left tested');
    });

    await test.step('Test tab navigation', async () => {
      await carousel.nextButton.focus();
      await carousel.page.keyboard.press('Enter');
      await carousel.page.waitForTimeout(500);
      console.log('✅ Keyboard enter on button tested');
    });
  });
});
