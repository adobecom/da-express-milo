import { expect, test } from '@playwright/test';
import { features } from './color-extract.spec.js';
import ColorExtractPage from './color-extract.page.js';

let colorExtract;

test.describe('Color Extract block test suite', () => {
  test.beforeEach(async ({ page }) => {
    colorExtract = new ColorExtractPage(page);
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name}`, async ({ baseURL }) => {
    await test.step('Navigate to page', async () => {
      await colorExtract.gotoURL(`${baseURL}${features[0].path}`);
    });

    await test.step('Block is visible', async () => {
      await colorExtract.scrollIntoView();
      await expect(colorExtract.block).toBeVisible();
    });

    await test.step('Landing stage is present', async () => {
      await expect(colorExtract.landing).toBeVisible();
    });

    await test.step('Dropzone is present in landing stage', async () => {
      await expect(colorExtract.dropzone).toBeVisible();
    });

    await test.step('Hero element is absent (refactored out to color-headline)', async () => {
      await expect(colorExtract.hero).toHaveCount(0);
    });
  });

  test(`[Test Id - ${features[1].tcid}] ${features[1].name}`, async ({ baseURL }) => {
    await test.step('Navigate to page', async () => {
      await colorExtract.gotoURL(`${baseURL}${features[1].path}`);
    });

    await test.step('Scroll block into view', async () => {
      await colorExtract.scrollIntoView();
      await expect(colorExtract.block).toBeVisible();
    });

    await test.step('Suggestion images are present', async () => {
      const count = await colorExtract.suggestions.count();
      expect(count).toBeGreaterThan(0);
    });

    await test.step('Edit stage is present', async () => {
      await expect(colorExtract.editStage).toBeAttached();
    });
  });
});
