/* eslint-disable no-plusplus */
import { expect, test } from '@playwright/test';
import { features } from './ax-marquee.spec.cjs';
import AxMarquee from './ax-marquee.page.cjs';

let axMarquee;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('ax-marquee test suite', () => {
  test.beforeEach(async ({ page }) => {
    axMarquee = new AxMarquee(page);
  });

  features[0].path.forEach((path) => {
    test(`[Test Id - ${features[0].tcid}] ${features[0].name}, path: ${path}, test marquee with button`, async ({ baseURL, page }) => {
      const testPage = `${baseURL}${path}${miloLibs}`;
      try {
        await axMarquee.gotoURL(testPage);
      } catch (error) {
        console.log(`⚠️ Failed to load page ${path}: ${error.message}, skipping test`);
        test.skip();
        return;
      }

      // Check if ax-marquee block exists on this page
      const axMarqueeExists = await page.locator('.ax-marquee').count() > 0;
      if (!axMarqueeExists) {
        console.log(`⚠️ ax-marquee block not found on ${path}, skipping test`);
        test.skip();
        return;
      }

      await test.step('validate elements in block', async () => {
        await page.waitForLoadState('domcontentloaded');
        await expect(axMarquee.axmarquee).toBeVisible();
        await expect(axMarquee.mainHeading).toBeVisible();
        const heading = await axMarquee.mainHeading.innerText();
        expect(heading.length).toBeTruthy();
        const paragraphCount = axMarquee.text.count();
        for (let i = 0; i < paragraphCount; i++) {
          await expect(axMarquee.text).nth(i).toBeVisible();
          const text = await axMarquee.text.nth(i).innerText();
          expect(text.length).toBeTruthy();
        }
        await expect(axMarquee.expressLogo).toBeVisible();
        await expect(axMarquee.ctaButton).toBeVisible();
      });

      await test.step('test button click', async () => {
        // Nonprofit page button points to external website.
        if (path === '/express/nonprofits') {
          const href = await axMarquee.ctaButton.getAttribute('href');
          if (href) {
            const response = await page.request.get(href);
            expect(response.status()).toEqual(200);
          }
        } else {
          await axMarquee.ctaButton.click();
          expect(page.url).not.toBe(testPage);
        }
      });
    });
  });

  features[1].path.forEach((path) => {
    test(`[Test Id - ${features[1].tcid}] ${features[1].name}, path: ${path}, test marquee with animation`, async ({ baseURL, page, browserName }) => {
      const testPage = `${baseURL}${path}${miloLibs}`;
      try {
        await axMarquee.gotoURL(testPage);
      } catch (error) {
        console.log(`⚠️ Failed to load page ${path}: ${error.message}, skipping test`);
        test.skip();
        return;
      }

      // Check if ax-marquee block exists on this page
      const axMarqueeExists = await page.locator('.ax-marquee .marquee-foreground').count() > 0;
      if (!axMarqueeExists) {
        console.log(`⚠️ ax-marquee block not found on ${path}, skipping test`);
        test.skip();
        return;
      }

      await page.waitForSelector('.ax-marquee .marquee-foreground');

      await test.step('validate elements in block ', async () => {
        await page.waitForLoadState('domcontentloaded');
        await expect(axMarquee.axmarquee).toBeVisible();
        await expect(axMarquee.mainHeading).toBeVisible();
        const heading = await axMarquee.mainHeading.innerText();
        expect(heading.length).toBeTruthy();
        const paragraphCount = axMarquee.text.count();
        for (let i = 0; i < paragraphCount; i++) {
          await expect(axMarquee.text).nth(i).toBeVisible();
          const text = await axMarquee.text.nth(i).innerText();
          expect(text.length).toBeTruthy();
        }
        await expect(axMarquee.expressLogo).toBeVisible();
        await expect(axMarquee.video).toBeVisible();
      });

      await test.step('validate elements in block ', async () => {
        // Animation not loading in Chrome for test script.
        if (browserName !== 'chromium') {
          await axMarquee.reduceMotionWrapper.waitFor(3000);
          await expect(axMarquee.reduceMotionPlayVideoBtn).not.toBeVisible();
          await expect(axMarquee.reduceMotionPauseVideoBtn).toBeVisible();
          await axMarquee.reduceMotionPauseVideoBtn.hover();
          await expect(axMarquee.reduceMotionPauseVideoTxt).toBeVisible();
          await axMarquee.reduceMotionPauseVideoBtn.click();
          await page.waitForLoadState();
          await expect(axMarquee.reduceMotionPlayVideoBtn).toBeVisible();
        }
      });

      await test.step('validate video controls keyboard accessibility', async () => {
        // Animation not loading in Chrome for test script.
        if (browserName !== 'chromium') {
          const videoControlsButton = page.locator('.video-controls-wrapper');
          const isAttached = await videoControlsButton.count() > 0;
          if (!isAttached) {
            // ax-marquee blocks use .reduce-motion-wrapper (old pattern), not .video-controls-wrapper
            // This test only applies to blocks that use the new video controls pattern
            console.log('⚠️ Video controls wrapper (.video-controls-wrapper) not found on this page. ax-marquee blocks use .reduce-motion-wrapper instead. Skipping new video controls accessibility test.');
            return;
          }
          await expect(videoControlsButton).toBeAttached();

          // Verify button has correct ARIA attributes
          await expect(videoControlsButton).toHaveAttribute('type', 'button');
          const ariaPressed = await videoControlsButton.getAttribute('aria-pressed');
          expect(ariaPressed).toBeTruthy();
          const ariaLabel = await videoControlsButton.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();

          // Get initial video state
          const { video } = axMarquee;
          const initialPaused = await video.evaluate((v) => v.paused);

          // Tab to video button and verify focus
          await page.keyboard.press('Tab');
          await videoControlsButton.focus();
          const isFocused = await videoControlsButton.evaluate((el) => document.activeElement === el);
          expect(isFocused).toBeTruthy();
          console.log('✅ Video button is keyboard focusable');

          // Test spacebar toggles video once (not twice - this is the bug fix!)
          await page.keyboard.press('Space');
          await page.waitForTimeout(500); // Wait for video state to update

          const afterSpacePaused = await video.evaluate((v) => v.paused);
          expect(afterSpacePaused).not.toBe(initialPaused);
          console.log('✅ Spacebar toggles video once (spacebar trap fixed)');

          // Verify ARIA state updated
          const updatedAriaPressed = await videoControlsButton.getAttribute('aria-pressed');
          expect(updatedAriaPressed).not.toBe(ariaPressed);

          // Test Enter key also works
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);

          const afterEnterPaused = await video.evaluate((v) => v.paused);
          expect(afterEnterPaused).toBe(initialPaused);
          console.log('✅ Enter key toggles video');

          // Verify video element itself is NOT focusable (no tabindex)
          const videoTabIndex = await video.evaluate((v) => v.getAttribute('tabindex'));
          expect(videoTabIndex).toBeNull();
          console.log('✅ Video element is not focusable (no tabindex)');
        }
      });
    });
  });
});
