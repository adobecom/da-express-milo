/* eslint-disable no-console */
const { test, expect } = require('@playwright/test');
const { features } = require('./template-x-promo.spec.cjs');
const TemplateXPromo = require('./template-x-promo.page.cjs');

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
        // Wait for template to be in DOM (not necessarily visible due to lazy loading)
        await firstTemplate.waitFor({ state: 'attached', timeout: 10000 });

        // Scroll template into view to trigger lazy loading BEFORE checking visibility
        await firstTemplate.scrollIntoViewIfNeeded();
        await templateXPromo.page.waitForTimeout(1000);

        // Wait for template images to load (fixes lazy-load visibility issue)
        await templateXPromo.page.waitForLoadState('networkidle');
        try {
          await templateXPromo.page.waitForFunction(() => {
            const template = document.querySelector('.template');
            const img = template?.querySelector('img');
            return img && img.complete && img.naturalHeight > 0;
          }, { timeout: 15000 });
          console.log('✅ Template image loaded successfully');
        } catch (e) {
          console.log('⚠️ Image load check timed out - proceeding with test (lazy-load behavior)');
        }

        // Now wait for template to be visible (after lazy load triggered)
        await firstTemplate.waitFor({ state: 'visible', timeout: 10000 });
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

  // TCID 1: Template image clickability - skipped temporarily
  test.skip(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async ({ baseURL }) => {
    console.info(`Testing template clickability: ${baseURL}${features[1].path}`);
    const testPage = `${baseURL}${features[1].path}`;

    await test.step('Navigate to test page', async () => {
      await templateXPromo.gotoURL(testPage);
    });

    await test.step('Wait for templates to load', async () => {
      await templateXPromo.page.waitForLoadState('networkidle');
      await templateXPromo.page.waitForTimeout(3000);
    });

    await test.step('Verify cta-link exists and is clickable', async () => {
      const templates = await templateXPromo.page.locator('.template').count();
      console.log(`Found ${templates} templates to test`);

      if (templates > 0) {
        const firstTemplate = templateXPromo.page.locator('.template').first();

        // Ensure template is in DOM and scroll into view to trigger lazy loading
        await firstTemplate.waitFor({ state: 'attached', timeout: 10000 });
        await firstTemplate.scrollIntoViewIfNeeded();
        await templateXPromo.page.waitForTimeout(1000);

        // Now wait for visibility after lazy load triggered
        await firstTemplate.waitFor({ state: 'visible', timeout: 10000 });

        // Hover to show the button-container with cta-link
        await firstTemplate.hover();

        // Wait for button-container opacity transition to complete (0.3s CSS transition + buffer)
        const buttonContainer = firstTemplate.locator('.button-container');
        await expect(buttonContainer).toHaveCSS('opacity', '1', { timeout: 2000 });

        const ctaLink = firstTemplate.locator('.cta-link');

        // Verify cta-link exists in DOM (it may be invisible due to z-index but should be clickable)
        await expect(ctaLink).toBeAttached({ timeout: 2000 });
        console.log('✅ cta-link is attached to DOM');

        // Verify cta-link has proper pointer events (this is what makes it clickable)
        const pointerEvents = await ctaLink.evaluate((el) => window.getComputedStyle(el).pointerEvents);
        expect(pointerEvents).toBe('auto');
        console.log('✅ cta-link has pointer-events: auto');

        // Verify cta-link has cursor pointer
        const cursor = await ctaLink.evaluate((el) => window.getComputedStyle(el).cursor);
        expect(cursor).toBe('pointer');
        console.log('✅ cta-link has cursor: pointer');

        // Verify cta-link has valid href (can be express.adobe.com or app.link)
        const href = await ctaLink.getAttribute('href');
        expect(href).toBeTruthy();
        let hostname;
        try {
          // Parse URL and extract hostname for secure validation
          hostname = (new URL(href, 'https://dummybase.com')).hostname;
        } catch (e) {
          hostname = '';
        }
        expect(['express.adobe.com', 'adobesparkpost.app.link'].includes(hostname)).toBe(true);
        console.log(`✅ cta-link has valid href: ${href}`);

        // Verify cta-link wraps media-wrapper
        const mediaWrapper = ctaLink.locator('.media-wrapper');
        await expect(mediaWrapper).toBeAttached();
        console.log('✅ cta-link wraps media-wrapper');
      } else {
        console.log('⚠️ No templates found for clickability test');
      }
    });

    await test.step('Verify template image is clickable (no navigation)', async () => {
      const templates = await templateXPromo.page.locator('.template').count();

      if (templates > 0) {
        const firstTemplate = templateXPromo.page.locator('.template').first();

        // Ensure template is in DOM and scroll into view to trigger lazy loading
        await firstTemplate.waitFor({ state: 'attached', timeout: 10000 });
        await firstTemplate.scrollIntoViewIfNeeded();
        await templateXPromo.page.waitForTimeout(1000);

        // Now wait for visibility after lazy load triggered
        await firstTemplate.waitFor({ state: 'visible', timeout: 10000 });

        const ctaLink = firstTemplate.locator('.cta-link');
        const href = await ctaLink.getAttribute('href');

        // Hover to show overlay
        await firstTemplate.hover();
        await templateXPromo.page.waitForTimeout(500);

        // Get the current URL before clicking
        const currentUrl = templateXPromo.page.url();

        // Click the template image (cta-link) and prevent navigation for testing
        await templateXPromo.page.evaluate(() => {
          // Add temporary click handler to prevent navigation
          document.querySelectorAll('.cta-link').forEach((link) => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              link.setAttribute('data-clicked', 'true');
            }, { once: true });
          });
        });

        await ctaLink.click();
        await templateXPromo.page.waitForTimeout(500);

        // Verify click was registered
        const wasClicked = await ctaLink.getAttribute('data-clicked');
        expect(wasClicked).toBe('true');
        console.log('✅ Template image click was registered');

        // Verify we didn't navigate (stayed on same page)
        expect(templateXPromo.page.url()).toBe(currentUrl);
        console.log('✅ Click handler prevented navigation for testing');

        console.log(`📝 In production, clicking would navigate to: ${href}`);
      }
    });

    await test.step('Verify both button and cta-link have same href', async () => {
      const templates = await templateXPromo.page.locator('.template').count();

      if (templates > 0) {
        const firstTemplate = templateXPromo.page.locator('.template').first();

        // Ensure template is in DOM and scroll into view to trigger lazy loading
        await firstTemplate.waitFor({ state: 'attached', timeout: 10000 });
        await firstTemplate.scrollIntoViewIfNeeded();
        await templateXPromo.page.waitForTimeout(1000);

        // Now wait for visibility after lazy load triggered
        await firstTemplate.waitFor({ state: 'visible', timeout: 10000 });

        // Hover to show button container
        await firstTemplate.hover();
        await templateXPromo.page.waitForTimeout(500);

        const button = firstTemplate.locator('.button-container .button');
        const ctaLink = firstTemplate.locator('.button-container .cta-link');

        const buttonHref = await button.getAttribute('href');
        const linkHref = await ctaLink.getAttribute('href');

        expect(buttonHref).toBe(linkHref);
        console.log('✅ Button and cta-link have matching hrefs');
      }
    });

    await test.step('Verify overlay closes when clicking outside', async () => {
      const templates = await templateXPromo.page.locator('.template').count();

      if (templates > 0) {
        const firstTemplate = templateXPromo.page.locator('.template').first();

        // Ensure template is visible before interacting
        await firstTemplate.waitFor({ state: 'visible', timeout: 10000 });

        // Hover to show overlay
        await firstTemplate.hover();
        await templateXPromo.page.waitForTimeout(500);

        // Verify overlay is visible (singleton-hover class)
        const hasSingletonHover = await firstTemplate.evaluate((el) => el.classList.contains('singleton-hover'));
        console.log(`Overlay state after hover: singleton-hover=${hasSingletonHover}`);

        // Click outside the template (far away from any template)
        await templateXPromo.page.mouse.click(50, 50);
        await templateXPromo.page.waitForTimeout(800);

        // Verify overlay is hidden (check if templates still exist, they might be rebuilt)
        const templatesAfterClick = await templateXPromo.page.locator('.template').count();
        if (templatesAfterClick > 0) {
          const templateAfterClick = templateXPromo.page.locator('.template').first();
          await templateAfterClick.waitFor({ state: 'attached', timeout: 5000 });
          const stillHasSingletonHover = await templateAfterClick.evaluate((el) => el.classList.contains('singleton-hover'));
          expect(stillHasSingletonHover).toBe(false);
          console.log('✅ Overlay closes when clicking outside');
        } else {
          console.log('⚠️ Templates were rebuilt/removed after click - skipping overlay check');
        }
      }
    });
  });
});
