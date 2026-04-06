import { expect, test } from '@playwright/test';
import { features } from './floating-button.spec.cjs';
import FloatingButton from './floating-button.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

let floatingButton;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Floating Button Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    floatingButton = new FloatingButton(page);
  });

  // Test 0 : Floating Button Block
  test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to floating-button block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify floating-button block content/specs', async () => {
      await expect(floatingButton.floatingButton).toBeAttached();

      await page.locator('.discover-cards').scrollIntoViewIfNeeded();
      await expect(floatingButton.floatingButton).toBeVisible({ timeout: 15000 });

      await page.waitForFunction(() => {
        const button = document.querySelector('.floating-button');
        if (!button) return false;
        const rect = button.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
      }, { timeout: 10000 });

      await expect(floatingButton.floatingButton).toContainText(data.buttonText);
    });

    await test.step('Verify hidden state is removed from accessibility tree', async () => {
      const footer = page.locator('.global-footer');
      await expect(footer).toBeAttached({ timeout: 20000 });
      await footer.scrollIntoViewIfNeeded();

      const wrapper = floatingButton.section;
      await expect(wrapper).toHaveClass(/floating-button--hidden/);
      await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      await expect(wrapper).toHaveAttribute('inert', '');

      const focusResult = await page.evaluate(() => {
        const w = document.querySelector('.floating-button-wrapper');
        const link = w?.querySelector('a');
        if (!link) return 'no-link';
        link.focus();
        return document.activeElement === link;
      });
      expect(focusResult).not.toBe(true);

      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(wrapper).not.toHaveAttribute('aria-hidden', 'true');
      await expect(wrapper).not.toHaveAttribute('inert', '');
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(floatingButton.section).toHaveAttribute('daa-lh');
      await expect(floatingButton.floatingButton).toHaveAttribute('daa-lh');
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: floatingButton.floatingButton });
    });

    await test.step('Verify CTA click navigates to target page', async () => {
      // Scroll past the hero CTA so the fixed floating button enters the viewport
      await page.locator('.discover-cards').scrollIntoViewIfNeeded();
      await expect(floatingButton.floatingButton).toBeVisible({ timeout: 15000 });
      await floatingButton.floatingButton.click({ timeout: 10000 });
      await expect(page).not.toHaveURL(`${testUrl}`);
    });
  });
});
