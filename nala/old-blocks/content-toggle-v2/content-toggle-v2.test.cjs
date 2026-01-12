import { expect, test } from '@playwright/test';
import { features } from './content-toggle-v2.spec.cjs';
import ContentToggleV2 from './content-toggle-v2.page.cjs';

let contentToggle;
const miloLibs = process.env.MILO_LIBS || '';

test.describe('content-toggle-v2 test suite', () => {
  test.beforeEach(async ({ page }) => {
    contentToggle = new ContentToggleV2(page);
  });

  const paths = Array.isArray(features[0].path) ? features[0].path : [features[0].path];
  paths.forEach((path) => {
    test(
      `[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}, path: ${path}`,
      async ({ baseURL, page }) => {
        const basePath = path.startsWith('http') ? path : `${baseURL}${path}`;
        const testUrl = `${basePath}${basePath.includes('?') ? '&' : '?'}tab=1${miloLibs}`;
        await contentToggle.gotoURL(testUrl);
        await page.waitForSelector('.content-toggle-wrapper', { state: 'attached', timeout: 15000 });
        await page.waitForSelector('.content-toggle-wrapper .content-toggle-v2 .content-toggle-button', { state: 'visible', timeout: 15000 });

        // Ensure block is present
        await expect(contentToggle.block).toBeVisible();
        await expect(contentToggle.carouselContainer).toBeVisible();

        // Tabs exist and first is active due to ?tab=1
        const tabCount = await contentToggle.tabs.count();
        expect(tabCount).toBeGreaterThan(1);
        await expect(contentToggle.activeTab).toBeVisible();
        await expect(contentToggle.activeTab).toHaveAttribute('aria-selected', 'true');
        await expect(contentToggle.activeTab).toHaveAttribute('tabindex', '0');

        // Verify sections: only one visible (no content-toggle-hidden)
        let visibleSections = 0;
        const totalSections = await contentToggle.sections.count();
        for (let i = 0; i < totalSections; i += 1) {
          const section = contentToggle.sections.nth(i);
          const classAttr = (await section.getAttribute('class')) || '';
          if (!/\bcontent-toggle-hidden\b/.test(classAttr)) visibleSections += 1;
        }
        expect(visibleSections).toBe(1);

        // Click on the second tab (index 1) and verify state updates
        const secondTab = contentToggle.tabs.nth(1);
        await secondTab.click();
        await expect(secondTab).toHaveClass(/active/);
        await expect(secondTab).toHaveAttribute('aria-selected', 'true');

        // URL should reflect tab param = 2
        await expect(page).toHaveURL(/\?tab=2/);

        // Visible section should switch; assert exactly one visible
        let visibleSections2 = 0;
        for (let i = 0; i < totalSections; i += 1) {
          const section = contentToggle.sections.nth(i);
          const classAttr = (await section.getAttribute('class')) || '';
          if (!/\bcontent-toggle-hidden\b/.test(classAttr)) visibleSections2 += 1;
        }
        expect(visibleSections2).toBe(1);

        // Keyboard navigation: ArrowRight should move focus to next tab (wrap if needed)
        await secondTab.focus();
        await page.keyboard.press('ArrowRight');
        const nextIndex = (1 + 1) % tabCount; // from second tab
        const nextTab = contentToggle.tabs.nth(nextIndex);
        await expect(nextTab).toBeFocused();

        // Space should activate focused tab
        await page.keyboard.press(' ');
        await expect(nextTab).toHaveClass(/active/);
        await expect(nextTab).toHaveAttribute('aria-selected', 'true');
        await expect(page).toHaveURL(new RegExp(`\\?tab=${nextIndex + 1}`));
      },
    );
  });
});
