const { test, expect } = require('@playwright/test');
const { features } = require('./how-to-v2.spec.cjs');
const HowToV2 = require('./how-to-v2.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

async function verifyStepsStructure(block) {
  const stepCount = await block.stepItems.count();
  expect(stepCount).toBeGreaterThan(0);
  expect(await block.stepIndicators.count()).toBe(stepCount);
  expect(await block.detailContainers.count()).toBe(stepCount);
  return stepCount;
}

async function verifyInitialAccordionState(block, stepCount) {
  await expect(block.stepItems.nth(0)).toHaveAttribute('aria-expanded', 'true');
  for (let i = 1; i < stepCount; i += 1) {
    await expect(block.stepItems.nth(i)).toHaveAttribute('aria-expanded', 'false');
  }
}

async function verifyAriaAttributes(block, stepCount) {
  for (let i = 0; i < stepCount; i += 1) {
    const item = block.stepItems.nth(i);
    await expect(item).toHaveAttribute('aria-expanded');
    await expect(item).toHaveAttribute('aria-controls');
    await expect(item).toHaveAttribute('tabindex', '0');
    const detailContainer = block.detailContainers.nth(i);
    await expect(detailContainer).toHaveAttribute('aria-labelledby');
  }
}

test.describe('HowToV2 Test Suite', () => {
  // Test Id : 0 : @how-to-v2-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}`;
    const block = new HowToV2(page, features[0].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block content', async () => {
      await expect(block.block).toBeVisible();
      const { semantic: sem } = data;

      for (const t of sem.texts) {
        await expect(block.block.locator(t.selector).nth(t.nth || 0)).toContainText(t.text);
      }

      for (const m of sem.media) {
        const locator = block.block.locator(m.selector).nth(m.nth || 0);
        const target = m.tag === 'picture' ? locator.locator('img') : locator;
        await expect(target).toBeVisible();
      }
    });

    await test.step('step-3: Verify step count and structural elements', async () => {
      await verifyStepsStructure(block);
    });

    await test.step('step-4: Verify background image is set', async () => {
      const bgImage = await block.block.evaluate((el) => getComputedStyle(el).getPropertyValue('--background-image'));
      expect(bgImage).toContain('url(');
    });

    await test.step('step-5: Verify initial accordion state and ARIA attributes', async () => {
      const stepCount = await block.stepItems.count();
      await verifyInitialAccordionState(block, stepCount);
      await verifyAriaAttributes(block, stepCount);
    });

    await test.step('step-6: Verify accordion opens step on click, closes others', async () => {
      const stepCount = await block.stepItems.count();
      for (let i = 0; i < Math.min(stepCount, 3); i += 1) {
        await block.stepTitles.nth(i).click();
        await expect(block.stepItems.nth(i)).toHaveAttribute('aria-expanded', 'true');
        for (let j = 0; j < stepCount; j += 1) {
          if (j !== i) await expect(block.stepItems.nth(j)).toHaveAttribute('aria-expanded', 'false');
        }
      }
    });

    await test.step('step-7: Verify keyboard navigation opens step', async () => {
      await block.stepItems.nth(1).focus();
      await page.keyboard.press('Enter');
      await expect(block.stepItems.nth(1)).toHaveAttribute('aria-expanded', 'true');
      await expect(block.stepItems.nth(0)).toHaveAttribute('aria-expanded', 'false');
    });

    await test.step('step-8: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-9: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });

  // Test Id : 1 : @how-to-v2-no-background
  test(`[Test Id - ${features[1].tcid}] ${features[1].name} ${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}`;
    const block = new HowToV2(page, features[1].selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify block content', async () => {
      await expect(block.block).toBeVisible();
      const { semantic: sem } = data;

      for (const t of sem.texts) {
        await expect(block.block.locator(t.selector).nth(t.nth || 0)).toContainText(t.text);
      }

      for (const m of sem.media) {
        const locator = block.block.locator(m.selector).nth(m.nth || 0);
        const target = m.tag === 'picture' ? locator.locator('img') : locator;
        await expect(target).toBeVisible();
      }
    });

    await test.step('step-3: Verify step count and structural elements', async () => {
      await verifyStepsStructure(block);
    });

    await test.step('step-4: Verify no background image is set', async () => {
      const bgImage = await block.block.evaluate((el) => getComputedStyle(el).getPropertyValue('--background-image'));
      expect(bgImage.trim()).toBe('');
    });

    await test.step('step-5: Verify initial accordion state and ARIA attributes', async () => {
      const stepCount = await block.stepItems.count();
      await verifyInitialAccordionState(block, stepCount);
      await verifyAriaAttributes(block, stepCount);
    });

    await test.step('step-6: Verify accordion opens step on click, closes others', async () => {
      const stepCount = await block.stepItems.count();
      for (let i = 0; i < Math.min(stepCount, 3); i += 1) {
        await block.stepTitles.nth(i).click();
        await expect(block.stepItems.nth(i)).toHaveAttribute('aria-expanded', 'true');
        for (let j = 0; j < stepCount; j += 1) {
          if (j !== i) await expect(block.stepItems.nth(j)).toHaveAttribute('aria-expanded', 'false');
        }
      }
    });

    await test.step('step-7: Verify keyboard navigation opens step', async () => {
      await block.stepItems.nth(1).focus();
      await page.keyboard.press('Enter');
      await expect(block.stepItems.nth(1)).toHaveAttribute('aria-expanded', 'true');
      await expect(block.stepItems.nth(0)).toHaveAttribute('aria-expanded', 'false');
    });

    await test.step('step-8: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-9: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[1], skipSeoTest: false });
    });
  });
});
