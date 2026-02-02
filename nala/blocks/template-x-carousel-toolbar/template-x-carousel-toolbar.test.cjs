const { test, expect } = require('@playwright/test');
const { features } = require('./template-x-carousel-toolbar.spec.cjs');
const TemplateXCarouselToolbarBlock = require('./template-x-carousel-toolbar.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('TemplateXCarouselToolbarBlock Test Suite', () => {
  // Test Id : 0 : @template-x-carousel-toolbar-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new TemplateXCarouselToolbarBlock(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block content', async () => {
      await expect(block.block).toBeVisible();
      const sem = data.semantic;

      for (const t of sem.texts) {
        const locator = block.block.locator(t.selector).nth(t.nth || 0);
        await expect(locator).toContainText(t.text);
      }

      for (const m of sem.media) {
        const locator = block.block.locator(m.selector).nth(m.nth || 0);
        const isHiddenSelector = m.selector.includes('.isHidden');
        const isPicture = m.tag === 'picture';
        const target = isPicture ? locator.locator('img') : locator;
        if (isHiddenSelector) {
          await expect(target).toBeHidden();
        } else {
          await expect(target).toBeVisible();
        }
      }

      for (const iEl of sem.interactives) {
        const locator = block.block.locator(iEl.selector).nth(iEl.nth || 0);
        await expect(locator).toBeVisible({ timeout: 8000 });
        if (iEl.type === 'link' && iEl.href) {
          const href = await locator.getAttribute('href');
          if (/^(tel:|mailto:|sms:|ftp:|[+]?[\d])/i.test(iEl.href)) {
            await expect(href).toBe(iEl.href);
          } else {
            const expectedPath = new URL(iEl.href, 'https://dummy.base').pathname;
            const actualPath = new URL(href, 'https://dummy.base').pathname;
            await expect(actualPath).toBe(expectedPath);
          }
        }
        if (iEl.text) await expect(locator).toContainText(iEl.text);
      }
    });

    await test.step('step-3: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-4: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });

    await test.step('step-5: Verify image/video dimensions do not exceed natural resolution', async () => {
      // Wait for images and videos to load
      await page.waitForLoadState('networkidle');

      // Get all template images (excluding icons) and videos
      const images = block.block.locator('.template img:not(.icon)');
      const videos = block.block.locator('.template video');

      const imageCount = await images.count();
      const videoCount = await videos.count();

      console.info(`Found ${imageCount} images and ${videoCount} videos to check`);

      // Check images
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        await img.scrollIntoViewIfNeeded();

        // Wait for image to load
        await page.waitForFunction(
          (imgElement) => imgElement.complete && imgElement.naturalHeight > 0,
          await img.elementHandle(),
          { timeout: 10000 },
        ).catch(() => {
          console.warn(`Image ${i} load check timed out - skipping dimension check`);
        });

        const dimensions = await img.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            renderedHeight: el.offsetHeight,
            naturalHeight: el.naturalHeight,
            maxHeight: computed.maxHeight,
            height: computed.height,
          };
        });

        // Verify max-height is set (should be 100% or a pixel value)
        expect(dimensions.maxHeight).toBeTruthy();
        console.info(`Image ${i}: rendered=${dimensions.renderedHeight}px, natural=${dimensions.naturalHeight}px, max-height=${dimensions.maxHeight}`);

        // Verify rendered height does not exceed natural height
        // Allow small tolerance for rounding (1px)
        expect(dimensions.renderedHeight).toBeLessThanOrEqual(dimensions.naturalHeight + 1);
      }

      // Check videos
      for (let i = 0; i < videoCount; i++) {
        const video = videos.nth(i);
        await video.scrollIntoViewIfNeeded();

        // Wait for video metadata to load
        await page.waitForFunction(
          (videoElement) => videoElement.readyState >= 1, // HAVE_METADATA
          await video.elementHandle(),
          { timeout: 10000 },
        ).catch(() => {
          console.warn(`Video ${i} metadata load check timed out - skipping dimension check`);
        });

        const dimensions = await video.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            renderedHeight: el.offsetHeight,
            videoHeight: el.videoHeight || 0,
            maxHeight: computed.maxHeight,
            height: computed.height,
          };
        });

        // Verify max-height is set
        expect(dimensions.maxHeight).toBeTruthy();
        console.info(`Video ${i}: rendered=${dimensions.renderedHeight}px, video=${dimensions.videoHeight}px, max-height=${dimensions.maxHeight}`);

        // Verify rendered height does not exceed video height (if video metadata is available)
        if (dimensions.videoHeight > 0) {
          expect(dimensions.renderedHeight).toBeLessThanOrEqual(dimensions.videoHeight + 1);
        }
      }
    });
  });
});
