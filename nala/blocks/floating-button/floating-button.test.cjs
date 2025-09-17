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

  // Test 0 : Floating Button
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
      await expect(floatingButton.floatingButton).toBeVisible();
      await page.evaluate(() => window.scrollBy(0, 500));
      await expect(floatingButton.floatingButton).toContainText(data.buttonText);
      await floatingButton.floatingButton.click();
      await expect(page).not.toHaveURL(`${testUrl}`);
    });

    await test.step('Verify hidden state is removed from accessibility tree', async () => {
      // Scroll footer into view so the CTA hides
      await page.locator('.global-footer').scrollIntoViewIfNeeded();
      const wrapper = floatingButton.section;
      await expect(wrapper).toHaveClass(/floating-button--hidden/);
      await expect(wrapper).toHaveAttribute('aria-hidden', 'true');
      await expect(wrapper).toHaveAttribute('inert', '');

      // Programmatically attempt to focus the CTA link; it should not receive focus
      const focusResult = await page.evaluate(() => {
        const w = document.querySelector('.floating-button-wrapper');
        const link = w?.querySelector('a');
        if (!link) return 'no-link';
        link.focus();
        return document.activeElement === link;
      });
      expect(focusResult).not.toBe(true);

      // Scroll back up and confirm attributes are removed
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
  });
});
