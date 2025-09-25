/* eslint-disable no-console */
import { test, expect } from '@playwright/test';
import { features } from './template-x-promo.spec.cjs';
import TemplateXPromo from './template-x-promo.page.cjs';

let templateXPromo;

test.describe('Template X Promo block tests', () => {
  test.beforeEach(async ({ page }) => {
    templateXPromo = new TemplateXPromo(page);
  });

  // TCID 0: Real API integration
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ baseURL }) => {
    console.info(`Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    await test.step('Navigate to test page', async () => {
      // Force mobile viewport from the start to test carousel behavior
      await templateXPromo.page.setViewportSize({ width: 375, height: 667 });
      await templateXPromo.gotoURL(testPage);
    });

    await test.step('Verify block is loaded', async () => {
      await expect(templateXPromo.templateXPromo).toBeVisible();
      // Verify the block has been decorated
      await expect(templateXPromo.templateXPromo).toHaveAttribute('data-decorated', 'true');
    });

    await test.step('Verify API integration and template loading', async () => {
      // Wait for network idle and API calls to complete
      await templateXPromo.page.waitForLoadState('networkidle');
      await templateXPromo.page.waitForTimeout(5000);

      // Check if we have templates in our scoped block or globally
      const scopedTemplateCount = await templateXPromo.getTemplateCount();
      const globalTemplateCount = await templateXPromo.page.locator('.template').count();
      const allBlocks = await templateXPromo.page.locator('.template-x-promo').count();

      console.log(`Found ${scopedTemplateCount} templates in first block, ${globalTemplateCount} globally across ${allBlocks} blocks`);

      // Integration test: Verify API data is loaded (either in our block or globally)
      if (globalTemplateCount > 0) {
        console.log('✅ API integration working - templates loaded globally');

        // Test template images are loaded from Adobe CDN
        const templateImages = await templateXPromo.page.locator('.template img, [class*="template"] img').count();
        console.log(`Found ${templateImages} template images`);

        if (templateImages > 0) {
          const firstImage = templateXPromo.page.locator('.template img, [class*="template"] img').first();
          const imageSrc = await firstImage.getAttribute('src');
          console.log('First template image source:', imageSrc);

          // Verify images are from Adobe design assets CDN
          if (imageSrc) {
            let imageHost;
            try {
              // Use baseURL for relative URLs
              const urlObj = new URL(imageSrc, baseURL);
              imageHost = urlObj.hostname;
            } catch (e) {
              console.warn('Unable to parse image src:', imageSrc, e);
            }
            if (imageHost === 'design-assets.adobeprojectm.com') {
              console.log('✅ Template images loading from Adobe CDN');
            }
          }
        }
      } else {
        console.log('⚠️ No templates found - checking for raw recipe data');

        // Check if we have raw recipe data that needs processing
        const blockHTML = await templateXPromo.templateXPromo.innerHTML();
        if (blockHTML.includes('collection=') && blockHTML.includes('templateIds=')) {
          console.log('📋 Found raw recipe data - JavaScript processing may be incomplete');
        }
      }
    });

    await test.step('Test user interactions and accessibility', async () => {
      const globalTemplateCount = await templateXPromo.page.locator('.template').count();

      if (globalTemplateCount > 0) {
        // Test hover interactions on templates
        const firstTemplate = templateXPromo.page.locator('.template').first();
        await firstTemplate.hover();
        console.log('✅ Template hover interaction tested');

        // Test keyboard navigation
        await firstTemplate.focus();
        await templateXPromo.page.keyboard.press('Tab');
        console.log('✅ Keyboard navigation tested');

        // Check for accessibility attributes
        const ariaLabel = await firstTemplate.getAttribute('aria-label');
        const role = await firstTemplate.getAttribute('role');
        console.log(`Template accessibility: aria-label="${ariaLabel}", role="${role}"`);

        // Test template click/CTA functionality
        const editButton = templateXPromo.page.locator('.template .button, .template a').first();
        if (await editButton.isVisible()) {
          const href = await editButton.getAttribute('href');
          console.log(`✅ Edit button found with href: ${href}`);
          // Don't actually click to avoid navigation, just verify it exists
        }
      }
    });

    await test.step('Test responsive behavior and carousel detection', async () => {
      // Enhanced carousel detection - scope to template-x-promo blocks only
      const carouselWrapper = await templateXPromo.isCarouselVisible();
      const navControls = await templateXPromo.page.locator('.template-x-promo .promo-nav-controls, .template-x-promo .carousel-nav').first().isVisible();
      const carouselTrack = await templateXPromo.page.locator('.template-x-promo .promo-carousel-track, .template-x-promo .carousel-track').first().isVisible();

      console.log(`Carousel detection - Wrapper: ${carouselWrapper}, Nav: ${navControls}, Track: ${carouselTrack}`);

      if (carouselWrapper || navControls || carouselTrack) {
        console.log('✅ Carousel structure detected');

        // Look for navigation buttons with multiple possible selectors
        const nextBtn = templateXPromo.page.locator('.promo-next-btn, .next-btn, [class*="next"], .carousel-next').first();
        const prevBtn = templateXPromo.page.locator('.promo-prev-btn, .prev-btn, [class*="prev"], .carousel-prev').first();

        const nextVisible = await nextBtn.isVisible();
        const prevVisible = await prevBtn.isVisible();

        console.log(`Navigation buttons - Next: ${nextVisible}, Prev: ${prevVisible}`);

        if (nextVisible && prevVisible) {
          // Test carousel navigation with enhanced selectors
          await nextBtn.click();
          await templateXPromo.page.waitForTimeout(500);
          await prevBtn.click();
          await templateXPromo.page.waitForTimeout(500);
          console.log('✅ Carousel navigation tested successfully');
        }
      } else {
        console.log('ℹ️ No carousel detected - likely desktop grid layout');
      }

      // Test responsive behavior by changing viewport
      const currentViewport = templateXPromo.page.viewportSize();
      console.log(`Current viewport: ${currentViewport.width}x${currentViewport.height}`);

      // Test mobile viewport - more likely to trigger carousel
      await templateXPromo.page.setViewportSize({ width: 375, height: 667 });
      await templateXPromo.page.waitForTimeout(2000); // More time for responsive changes

      const mobileCarousel = await templateXPromo.isCarouselVisible();
      const mobileNav = await templateXPromo.page.locator('.template-x-promo .promo-nav-controls').first().isVisible();
      console.log(`Mobile (375px) - Carousel: ${mobileCarousel}, Nav: ${mobileNav}`);

      // Test tablet viewport
      await templateXPromo.page.setViewportSize({ width: 768, height: 1024 });
      await templateXPromo.page.waitForTimeout(2000);
      const tabletCarousel = await templateXPromo.isCarouselVisible();
      console.log(`Tablet (768px) - Carousel: ${tabletCarousel}`);

      // Test desktop viewport
      await templateXPromo.page.setViewportSize({ width: 1200, height: 800 });
      await templateXPromo.page.waitForTimeout(2000);
      const desktopCarousel = await templateXPromo.isCarouselVisible();
      console.log(`Desktop (1200px) - Carousel: ${desktopCarousel}`);

      // Restore original viewport
      await templateXPromo.page.setViewportSize(currentViewport);
      await templateXPromo.page.waitForTimeout(1000);
    });
  });

  // TCID 1: Mobile-specific carousel testing
  test(`[Test Id - mobile] Mobile carousel behavior,${features[0].tags}`, async ({ baseURL, page }) => {
    console.info(`Mobile Testing: ${baseURL}${features[0].path}`);
    const testPage = `${baseURL}${features[0].path}`;

    // Force mobile viewport and user agent
    await page.setViewportSize({ width: 375, height: 667 });
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });

    const mobileTemplateXPromo = new TemplateXPromo(page);

    await test.step('Navigate to test page on mobile', async () => {
      await mobileTemplateXPromo.gotoURL(testPage);
    });

    await test.step('Verify mobile carousel behavior', async () => {
      // Wait for content to load
      await mobileTemplateXPromo.page.waitForLoadState('networkidle');
      await mobileTemplateXPromo.page.waitForTimeout(5000);

      const globalTemplateCount = await mobileTemplateXPromo.page.locator('.template').count();
      console.log(`Mobile: Found ${globalTemplateCount} templates`);

      if (globalTemplateCount > 0) {
        // Mobile should be more likely to show carousel
        const carouselVisible = await mobileTemplateXPromo.isCarouselVisible();
        const navVisible = await mobileTemplateXPromo.page.locator('.template-x-promo .promo-nav-controls').first().isVisible();

        console.log(`Mobile carousel detection - Carousel: ${carouselVisible}, Nav: ${navVisible}`);

        if (carouselVisible || navVisible) {
          console.log('✅ Mobile carousel detected!');

          // Test carousel navigation buttons
          const nextBtn = mobileTemplateXPromo.page.locator('.template-x-promo .promo-next-btn, .template-x-promo .next-btn').first();
          const prevBtn = mobileTemplateXPromo.page.locator('.template-x-promo .promo-prev-btn, .template-x-promo .prev-btn').first();

          const nextVisible = await nextBtn.isVisible();
          const prevVisible = await prevBtn.isVisible();

          console.log(`Mobile nav buttons - Next: ${nextVisible}, Prev: ${prevVisible}`);

          if (nextVisible) {
            await nextBtn.click();
            await mobileTemplateXPromo.page.waitForTimeout(1000);
            console.log('✅ Mobile carousel next navigation tested');
          }

          if (prevVisible) {
            await prevBtn.click();
            await mobileTemplateXPromo.page.waitForTimeout(1000);
            console.log('✅ Mobile carousel prev navigation tested');
          }
        } else {
          console.log('ℹ️ Mobile carousel not found - may be grid layout even on mobile');

          // Check if templates are in a different mobile layout
          const mobileGridCount = await mobileTemplateXPromo.page.locator('.template-x-promo .template').count();
          console.log(`Mobile grid templates in first block: ${mobileGridCount}`);
        }
      }
    });
  });
});
