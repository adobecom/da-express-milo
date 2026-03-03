const { test, expect } = require('@playwright/test');
const { features } = require('./holiday-blade.spec.cjs');
const HolidayBladeBlock = require('./holiday-blade.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('HolidayBladeBlock Test Suite', () => {
  // Test Id : 0 : @holiday-blade-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new HolidayBladeBlock(page, features[0].selector);
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

  // Test Id : 1 : @holiday-blade-still-only
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;
    const block = new HolidayBladeBlock(page, features[1].selector);
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

  // Test Id : 2 : @holiday-blade-premium-only
  test(`[Test Id - ${features[2].tcid}] ${features[2].name} ${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;
    const block = new HolidayBladeBlock(page, features[2].selector);
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

  // Test Id : 3 : @holiday-blade-light
  test(`[Test Id - ${features[3].tcid}] ${features[3].name} ${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;
    const block = new HolidayBladeBlock(page, features[3].selector);
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

  // Test Id : 4 : @holiday-blade-free-only
  test(`[Test Id - ${features[4].tcid}] ${features[4].name} ${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    const testUrl = `${baseURL}${features[4].path}${miloLibs}`;
    const block = new HolidayBladeBlock(page, features[4].selector);
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
      await runSeoChecks({ page, feature: features[4], skipSeoTest: false });
    });
  });

  // Test Id : 5 : @holiday-blade-animated-only
  test(`[Test Id - ${features[5].tcid}] ${features[5].name} ${features[5].tags}`, async ({ page, baseURL }) => {
    const { data } = features[5];
    const testUrl = `${baseURL}${features[5].path}${miloLibs}`;
    const block = new HolidayBladeBlock(page, features[5].selector);
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
      await runSeoChecks({ page, feature: features[5], skipSeoTest: false });
    });
  });
});
