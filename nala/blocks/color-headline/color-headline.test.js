import { expect, test } from '@playwright/test';
import { features } from './color-headline.spec.js';
import ColorHeadlinePage from './color-headline.page.js';

let colorHeadline;

test.describe('Color Headline block test suite', () => {
  test.beforeEach(async ({ page }) => {
    colorHeadline = new ColorHeadlinePage(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name}`, async ({ baseURL }) => {
    await test.step('Navigate to page', async () => {
      await colorHeadline.gotoURL(`${baseURL}${features[0].path}`);
    });

    await test.step('Scroll block into view', async () => {
      await colorHeadline.scrollIntoView();
      await expect(colorHeadline.block.first()).toBeVisible();
    });

    await test.step('Verify heading is non-empty', async () => {
      const headingText = await colorHeadline.heading.innerText();
      expect(headingText.length).toBeGreaterThan(0);
    });

    await test.step('Verify paragraph is non-empty', async () => {
      const paragraphText = await colorHeadline.paragraph.innerText();
      expect(paragraphText.length).toBeGreaterThan(0);
    });
  });

  test(`[Test Id - ${features[1].tcid}] ${features[1].name}`, async ({ baseURL }) => {
    await test.step('Navigate to page', async () => {
      await colorHeadline.gotoURL(`${baseURL}${features[1].path}`);
    });

    await test.step('Extract variant is visible', async () => {
      await colorHeadline.scrollIntoView();
      await expect(colorHeadline.extractBlock).toBeVisible();
    });

    await test.step('Express logo is injected before the heading', async () => {
      await expect(colorHeadline.logo).toBeVisible();
    });

    await test.step('Logo appears before the heading', async () => {
      const logoPosition = await colorHeadline.logo.boundingBox();
      const headingPosition = await colorHeadline.heading.boundingBox();
      expect(logoPosition.y).toBeLessThan(headingPosition.y);
    });
  });
});
