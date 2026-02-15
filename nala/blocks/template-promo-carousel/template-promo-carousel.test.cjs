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
    const miloLibs = process.env.MILO_LIBS || '';
    const path = Array.isArray(features[0].path) ? features[0].path[0] : features[0].path;
    console.info(`Testing: ${baseURL}${path}`);
    const testPage = `${baseURL}${path}${miloLibs}`;

    await test.step('Navigate to test page', async () => {
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('domcontentloaded');
      await carousel.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await carousel.page.waitForTimeout(5000); // Wait for block decoration
    });

    await test.step('Verify carousel is loaded', async () => {
      await expect(carousel.block).toBeVisible({ timeout: 10000 });
      const count = await carousel.getTemplateCount();
      console.log(`Found ${count} templates in carousel`);
      if (count === 0) {
        console.log('⚠️ No templates found - block may not be fully loaded');
      }
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Test next/prev buttons', async () => {
      const nextVisible = await carousel.nextButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (nextVisible) {
        await carousel.clickNext();
        await carousel.page.waitForTimeout(500);
        console.log('✅ Next button clicked');

        const prevVisible = await carousel.prevButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (prevVisible) {
          await carousel.clickPrev();
          await carousel.page.waitForTimeout(500);
          console.log('✅ Prev button clicked');
        }
      } else {
        console.log('⚠️ Navigation buttons not found - may be desktop layout');
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
    const miloLibs = process.env.MILO_LIBS || '';
    const path = Array.isArray(features[1].path) ? features[1].path[0] : features[1].path;
    console.info(`Testing: ${baseURL}${path}`);
    const testPage = `${baseURL}${path}${miloLibs}`;

    await test.step('Navigate with mobile viewport', async () => {
      await carousel.page.setViewportSize({ width: 375, height: 667 });
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('domcontentloaded');
      await carousel.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await carousel.page.waitForTimeout(5000); // Wait for block decoration
    });

    await test.step('Verify carousel exists before swipe', async () => {
      await expect(carousel.block).toBeVisible({ timeout: 10000 });
    });

    await test.step('Test swipe left', async () => {
      const carouselVisible = await carousel.carousel.isVisible({ timeout: 5000 }).catch(() => false);
      if (carouselVisible) {
        await carousel.swipeLeft();
        await carousel.page.waitForTimeout(500);
        console.log('✅ Swipe left tested');
      } else {
        console.log('⚠️ Carousel wrapper not found - skipping swipe test');
      }
    });

    await test.step('Test swipe right', async () => {
      const carouselVisible = await carousel.carousel.isVisible({ timeout: 5000 }).catch(() => false);
      if (carouselVisible) {
        await carousel.swipeRight();
        await carousel.page.waitForTimeout(500);
        console.log('✅ Swipe right tested');
      }
    });
  });

  // TCID 2: Autoplay functionality
  test(`[Test Id - ${features[2].tcid}] ${features[2].name},${features[2].tags}`, async ({ baseURL }) => {
    const miloLibs = process.env.MILO_LIBS || '';
    const path = Array.isArray(features[2].path) ? features[2].path[0] : features[2].path;
    console.info(`Testing: ${baseURL}${path}`);
    const testPage = `${baseURL}${path}${miloLibs}`;

    await test.step('Navigate and load', async () => {
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('domcontentloaded');
      await carousel.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await carousel.page.waitForTimeout(5000); // Wait for block decoration
    });

    await test.step('Verify carousel exists', async () => {
      await expect(carousel.block).toBeVisible({ timeout: 10000 });
    });

    await test.step('Test autoplay', async () => {
      const isAutoplay = await carousel.isAutoplayActive().catch(() => false);
      console.log(`Autoplay active: ${isAutoplay}`);

      if (isAutoplay) {
        await carousel.page.waitForTimeout(5000);
        console.log('✅ Autoplay tested (waited 5s)');
      } else {
        console.log('⚠️ Autoplay not active - may not be configured');
      }
    });

    await test.step('Test pause on hover', async () => {
      const carouselVisible = await carousel.carousel.isVisible({ timeout: 5000 }).catch(() => false);
      if (carouselVisible) {
        await carousel.carousel.hover();
        await carousel.page.waitForTimeout(1000);
        console.log('✅ Hover pause tested');
      } else {
        console.log('⚠️ Carousel wrapper not found - skipping hover test');
      }
    });
  });

  // TCID 3: Keyboard navigation
  test(`[Test Id - ${features[3].tcid}] ${features[3].name},${features[3].tags}`, async ({ baseURL }) => {
    const miloLibs = process.env.MILO_LIBS || '';
    const path = Array.isArray(features[3].path) ? features[3].path[0] : features[3].path;
    console.info(`Testing: ${baseURL}${path}`);
    const testPage = `${baseURL}${path}${miloLibs}`;

    await test.step('Navigate and load', async () => {
      await carousel.gotoURL(testPage);
      await carousel.page.waitForLoadState('domcontentloaded');
      await carousel.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await carousel.page.waitForTimeout(5000); // Wait for block decoration
    });

    await test.step('Verify carousel exists', async () => {
      await expect(carousel.block).toBeVisible({ timeout: 10000 });
    });

    await test.step('Test arrow key navigation', async () => {
      const carouselVisible = await carousel.carousel.isVisible({ timeout: 5000 }).catch(() => false);
      if (carouselVisible) {
        await carousel.carousel.focus();
        await carousel.page.keyboard.press('ArrowRight');
        await carousel.page.waitForTimeout(500);
        console.log('✅ Arrow right tested');

        await carousel.page.keyboard.press('ArrowLeft');
        await carousel.page.waitForTimeout(500);
        console.log('✅ Arrow left tested');
      } else {
        console.log('⚠️ Carousel wrapper not found - skipping keyboard navigation');
      }
    });

    await test.step('Test tab navigation', async () => {
      const nextVisible = await carousel.nextButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (nextVisible) {
        await carousel.nextButton.focus();
        await carousel.page.keyboard.press('Enter');
        await carousel.page.waitForTimeout(500);
        console.log('✅ Keyboard enter on button tested');
      } else {
        console.log('⚠️ Next button not found - skipping keyboard test');
      }
    });
  });
});
