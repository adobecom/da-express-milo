const { test, expect } = require('@playwright/test');
const BlogColumnsBlock = require('./blog-columns.page.cjs');
const { features } = require('./blog-columns.spec.cjs');

test.describe('Blog Columns block', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/drafts/nala/blocks/blog-columns/default');
  });

  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page }) => {
    const block = new BlogColumnsBlock(page);
    await expect(block.block).toBeVisible();
    const inner = block.block.locator('.blog-columns-inner');
    await expect(inner).toBeVisible();
    const row = block.block.locator('.blog-columns-row');
    await expect(row).toBeVisible();
  });
});
