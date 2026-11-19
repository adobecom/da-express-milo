const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./template-x-carousel-toolbar.spec.cjs');
const { hasAuthState } = require('../../libs/ims-login.cjs');

const miloLibs = process.env.MILO_LIBS || '';
const feature = features.find((f) => f.name === '@template-x-carousel-toolbar-search-bar');
const SEARCH_TERM = 'birthday';

// The templates API (www.adobe.com) isn't reachable from GitHub runners, and the
// block replaces itself with an error without it. Same fixture shape as
// template-x-carousel.test.cjs; only the search redirect is under test here.
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

const MOCK_API_RESPONSE = {
  metadata: { totalHits: 5, start: '0', limit: '10' },
  items: Array.from({ length: 5 }, (_, i) => ({ ...MOCK_TEMPLATE, id: `${MOCK_TEMPLATE.id}-${i}` })),
};

test.describe('TemplateXCarouselToolbar signed-in test suite', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), 'No signed-in session (set IMS_EMAIL / IMS_PASS or run `npm run nala:login`)');
    // Block test hook: capture the redirect instead of leaving the page.
    await page.addInitScript(() => {
      window.t_locationAssign = (url) => { window.nalaRedirectUrl = url; };
    });
    await page.route('**/express-search-api-v3**', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_API_RESPONSE),
    }));
  });

  test(`[Test Id - ${feature.tcid}] ${feature.name} signed-in search redirect ${feature.tags.join(' ')}`, async ({ page, baseURL }) => {
    const testUrl = `${baseURL}${feature.path}${miloLibs}`;
    const block = page.locator(feature.selector);
    const searchInput = block.locator('input.search-bar');
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Go to page as a signed-in user', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(block).toBeVisible({ timeout: 20000 });
      await page.waitForFunction(() => window.adobeIMS?.isSignedInUser?.(), null, { timeout: 30000 });
    });

    await test.step('step-2: Search redirects to the signed-in templates page', async () => {
      await searchInput.fill(SEARCH_TERM);
      await searchInput.press('Enter');
      const redirect = new URL(await (await page.waitForFunction(() => window.nalaRedirectUrl, null, { timeout: 15000 })).jsonValue());
      expect(redirect.hostname).toBe('new.express.adobe.com');
      expect(redirect.pathname).toBe('/explore/templates');
      expect(redirect.searchParams.get('q')).toBe(SEARCH_TERM);
    });
  });
});
