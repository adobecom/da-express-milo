const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./gen-template-marquee.spec.cjs');
const GenTemplateMarqueeBlock = require('./gen-template-marquee.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('GenTemplateMarqueeBlock Test Suite', () => {
  // Test Id : 0 : @gen-template-marquee-default
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const block = new GenTemplateMarqueeBlock(page, features[0].selector);

    await test.step('step-1: Navigate to page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('step-2: Verify authored text and prompt controls', async () => {
      await expect(block.block).toBeVisible();
      await expect(block.logo).toBeVisible();
      await expect(block.heading).toHaveText('Generate templates with AI.');
      await expect(block.body).toContainText('Create a fully editable template');
      await expect(block.prompt).toHaveAttribute('placeholder', 'Describe what template you want to make');
      await expect(block.generate).toContainText('Generate');
      await expect(block.suggestionsLabel).toHaveText('Get started with an example prompt');
      await expect(block.suggestions).toHaveCount(4);
    });

    await test.step('step-3: Fill the prompt from a suggestion', async () => {
      await block.suggestions.first().click();
      await expect(block.prompt).toHaveValue('Dog trainer advertisement');
    });

    await test.step('step-4: Verify gallery media', async () => {
      await expect(block.gallery).toBeAttached();
      await expect(block.columns).toHaveCount(5);
      await expect(block.cards).toHaveCount(14);
      await expect(block.images.first()).toBeAttached();
    });

    await test.step('step-5: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block, skipA11yTest: false });
    });

    await test.step('step-6: SEO validation', async () => {
      await runSeoChecks({ page, feature: features[0], skipSeoTest: false });
    });
  });
});
