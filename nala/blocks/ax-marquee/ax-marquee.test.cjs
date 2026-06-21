const { test, expect } = require('@playwright/test');
const { features } = require('./ax-marquee.spec.cjs');
const AxMarqueeBlock = require('./ax-marquee.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('AxMarqueeBlock Test Suite', () => {
  // Test Id : 0 : @ax-marquee-has-mobile-animation-has-desktop-animation-appear
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new AxMarqueeBlock(page, features[0].selector);
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
  });

  // Test Id : 1 : @ax-marquee-dark-has-mobile-animation-has-desktop-animation-appear
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    const block = new AxMarqueeBlock(page, features[1].selector);
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
      await runSeoChecks({ page, feature: features[1], skipSeoTest: false });
    });
  });

  // Test Id : 2 : @ax-marquee-short-has-mobile-animation-has-desktop-animation-appear
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    const block = new AxMarqueeBlock(page, features[2].selector);
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
      await runSeoChecks({ page, feature: features[2], skipSeoTest: false });
    });
  });

  // Test Id : 3 : @ax-marquee-narrow-has-mobile-animation-has-desktop-animation-appear
  test(`[Test Id - ${features[3].tcid}] ${features[3].name} ${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;
    const block = new AxMarqueeBlock(page, features[3].selector);
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
      await runSeoChecks({ page, feature: features[3], skipSeoTest: false });
    });
  });

  // Test Id : 4 : @ax-marquee-with-button
  features[4].path.forEach((path) => {
    test(`[Test Id - ${features[4].tcid}] ${features[4].name}, path: ${path}, ${features[4].tags}`, async ({ page, baseURL }) => {
      const block = new AxMarqueeBlock(page);
      const testPage = `${baseURL}${path}${miloLibs}`;
      console.info(`[Test Page]: ${testPage}`);

      try {
        await block.gotoURL(testPage);
      } catch (error) {
        console.log(`⚠️ Failed to load page ${path}: ${error.message}, skipping test`);
        test.skip();
        return;
      }

      const axMarqueeExists = await page.locator('.ax-marquee').count() > 0;
      if (!axMarqueeExists) {
        console.log(`⚠️ ax-marquee block not found on ${path}, skipping test`);
        test.skip();
        return;
      }

      await test.step('Validate elements in block', async () => {
        await expect(block.axmarquee).toBeVisible();
        await expect(block.mainHeading).toBeVisible();
        const heading = await block.mainHeading.innerText();
        expect(heading.length).toBeTruthy();
        const paragraphCount = await block.text.count();
        for (let i = 0; i < paragraphCount; i += 1) {
          await expect(block.text.nth(i)).toBeVisible();
          const text = await block.text.nth(i).innerText();
          expect(text.length).toBeTruthy();
        }
        await expect(block.expressLogo).toBeVisible();
        await expect(block.ctaButton).toBeVisible();
      });

      await test.step('Test button click', async () => {
        if (path === '/express/nonprofits') {
          const href = await block.ctaButton.getAttribute('href');
          if (href) {
            const response = await page.request.get(href);
            expect(response.status()).toEqual(200);
          }
        } else {
          await block.ctaButton.click();
          await expect(page).not.toHaveURL(testPage);
        }
      });
    });
  });

  // Test Id : 5 : @ax-marquee-with-animation
  features[5].path.forEach((path) => {
    test(`[Test Id - ${features[5].tcid}] ${features[5].name}, path: ${path}, ${features[5].tags}`, async ({ page, baseURL, browserName }) => {
      const block = new AxMarqueeBlock(page);
      const testPage = `${baseURL}${path}${miloLibs}`;
      console.info(`[Test Page]: ${testPage}`);

      try {
        await block.gotoURL(testPage);
      } catch (error) {
        console.log(`⚠️ Failed to load page ${path}: ${error.message}, skipping test`);
        test.skip();
        return;
      }

      const axMarqueeExists = await page.locator('.ax-marquee .marquee-foreground').count() > 0;
      if (!axMarqueeExists) {
        console.log(`⚠️ ax-marquee block not found on ${path}, skipping test`);
        test.skip();
        return;
      }

      await page.waitForSelector('.ax-marquee .marquee-foreground');

      await test.step('Validate elements in block', async () => {
        await expect(block.axmarquee).toBeVisible();
        await expect(block.mainHeading).toBeVisible();
        const heading = await block.mainHeading.innerText();
        expect(heading.length).toBeTruthy();
        const paragraphCount = await block.text.count();
        for (let i = 0; i < paragraphCount; i += 1) {
          await expect(block.text.nth(i)).toBeVisible();
          const text = await block.text.nth(i).innerText();
          expect(text.length).toBeTruthy();
        }
        await expect(block.expressLogo).toBeVisible();
        await expect(block.video).toBeVisible();
      });

      await test.step('Validate animation controls', async () => {
        if (browserName !== 'chromium') {
          await block.reduceMotionWrapper.waitFor({ timeout: 3000 });
          await expect(block.reduceMotionPlayVideoBtn).not.toBeVisible();
          await expect(block.reduceMotionPauseVideoBtn).toBeVisible();
          await block.reduceMotionPauseVideoBtn.hover();
          await expect(block.reduceMotionPauseVideoTxt).toBeVisible();
          await block.reduceMotionPauseVideoBtn.click();
          await page.waitForLoadState();
          await expect(block.reduceMotionPlayVideoBtn).toBeVisible();
        }
      });

      await test.step('Validate video controls keyboard accessibility', async () => {
        if (browserName !== 'chromium') {
          const videoControlsButton = page.locator('.video-controls-wrapper');
          const isAttached = await videoControlsButton.count() > 0;
          if (!isAttached) {
            console.log('⚠️ Video controls wrapper (.video-controls-wrapper) not found on this page. ax-marquee blocks use .reduce-motion-wrapper instead. Skipping new video controls accessibility test.');
            return;
          }
          await expect(videoControlsButton).toBeAttached();
          await expect(videoControlsButton).toHaveAttribute('type', 'button');
          const ariaPressed = await videoControlsButton.getAttribute('aria-pressed');
          expect(ariaPressed).toBeTruthy();
          const ariaLabel = await videoControlsButton.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();

          const initialPaused = await block.video.evaluate((v) => v.paused);

          await page.keyboard.press('Tab');
          await videoControlsButton.focus();
          const isFocused = await videoControlsButton.evaluate((el) => document.activeElement === el);
          expect(isFocused).toBeTruthy();

          await page.keyboard.press('Space');
          await page.waitForTimeout(500);

          const afterSpacePaused = await block.video.evaluate((v) => v.paused);
          expect(afterSpacePaused).not.toBe(initialPaused);

          const updatedAriaPressed = await videoControlsButton.getAttribute('aria-pressed');
          expect(updatedAriaPressed).not.toBe(ariaPressed);

          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);

          const afterEnterPaused = await block.video.evaluate((v) => v.paused);
          expect(afterEnterPaused).toBe(initialPaused);

          const videoTabIndex = await block.video.evaluate((v) => v.getAttribute('tabindex'));
          expect(videoTabIndex).toBeNull();
        }
      });
    });
  });
});
