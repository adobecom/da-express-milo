const { test, expect } = require('@playwright/test');
const { features } = require('./template-x-carousel.spec.cjs');
const TemplateXCarouselBlock = require('./template-x-carousel.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

const miloLibs = process.env.MILO_LIBS || '';

// ---------------------------------------------------------------------------
// Mock API fixture — matches the real shape required by isValidTemplate() in
// template-utils.js. Intercepting the network call avoids CORS / HTTP2 issues
// when running against non-adobe.com origins (localhost, branch previews, etc).
// ---------------------------------------------------------------------------
const MOCK_TEMPLATE = {
  id: 'urn:aaid:sc:VA6C2:74f8db2e-e6b0-5c4d-acc0-b769b373ed54',
  status: 'approved',
  assetType: 'Template',
  behaviors: ['still'],
  'dc:title': { 'i-default': 'Pink Floral Workshop Flyer' },
  pages: [
    {
      task: { name: 'flyer' },
      rendition: {
        image: {
          thumbnail: {
            componentId: 'fcb8f005-cd35-4826-94e5-c5faee5d54b3',
            width: 386,
            height: 500,
            mediaType: 'image/webp',
          },
        },
      },
    },
  ],
  customLinks: { branchUrl: 'https://adobesparkpost.app.link/uHF8ZOZG6Kb' },
  _links: {
    'http://ns.adobe.com/adobecloud/rel/rendition': {
      href: 'https://design-assets.adobeprojectm.com/content/download/express/public/urn:aaid:sc:VA6C2:74f8db2e-e6b0-5c4d-acc0-b769b373ed54/rendition?assetType=TEMPLATE{&page,size,type,fragment}',
    },
    'http://ns.adobe.com/adobecloud/rel/component': {
      href: 'https://design-assets.adobeprojectm.com/content/download/express/public/urn:aaid:sc:VA6C2:74f8db2e-e6b0-5c4d-acc0-b769b373ed54/component?assetType=TEMPLATE{&revision,component_id}',
    },
  },
};

// 5 items with unique IDs so dedup() in fetchResults keeps all of them
const MOCK_API_RESPONSE = {
  metadata: { totalHits: 5, start: '0', limit: '10' },
  items: Array.from({ length: 5 }, (_, i) => ({ ...MOCK_TEMPLATE, id: `${MOCK_TEMPLATE.id}-${i}` })),
};

test.describe('Template X Carousel block tests', () => {
  // TCID 0: Default variant
  test(`[Test Id - ${features[0].tcid}] ${features[0].name} ${features[0].tags.join(' ')}`, async ({ page, baseURL }) => {
    const feature = features[0];
    const { data } = feature;
    const testUrl = `${baseURL}${feature.path}${miloLibs}`;
    const block = new TemplateXCarouselBlock(page, feature.selector);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Navigate to test page', async () => {
      // Intercept express-search-api-v3 before navigation so the block's fetch
      // call is fulfilled immediately with local fixture data in all environments.
      await page.route('**/express-search-api-v3**', (route) => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_API_RESPONSE),
      }));

      await block.goto(testUrl);
      await block.waitForBlockReady();
      await expect(block.block).toBeVisible();
    });

    await test.step('step-2: Verify block structure (heading, description)', async () => {
      await expect(block.headersContainer).toBeVisible();
      await expect(block.heading).toBeVisible();
      await expect(block.heading).toContainText(data.heading);
      await expect(block.description).toBeVisible();
      await expect(block.description).toContainText(data.description);
    });

    await test.step('step-3: Verify templates are loaded', async () => {
      await block.waitForTemplates();
      const templateCount = await block.templates.count();
      expect(templateCount).toBeGreaterThan(0);
      console.info(`[Templates loaded]: ${templateCount}`);

      // Verify templates container has gallery attributes
      await expect(block.templatesContainer).toHaveClass(/gallery/);
      await expect(block.templatesContainer).toHaveAttribute('aria-roledescription', 'carousel');
      await expect(block.templatesContainer).toHaveAttribute('role', 'group');
    });

    await test.step('step-4: Verify gallery carousel controls', async () => {
      await expect(block.galleryControl).toBeAttached();
      await expect(block.prevButton).toBeAttached();
      await expect(block.nextButton).toBeAttached();

      // Verify prev/next buttons have accessible labels
      await expect(block.prevButton).toHaveAttribute('aria-label', /prev/i);
      await expect(block.nextButton).toHaveAttribute('aria-label', /next/i);
    });

    await test.step('step-5: Accessibility validation', async () => {
      await runAccessibilityTest({ page, testScope: block.block });
    });

    await test.step('step-6: SEO validation', async () => {
      await runSeoChecks({ page, feature });
    });
  });
});
