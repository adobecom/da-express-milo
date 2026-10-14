const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./template-x-carousel-toolbar.spec.cjs');
const { hasAuthState } = require('../../libs/ims-login.cjs');

const miloLibs = process.env.MILO_LIBS || '';
const feature = features.find((f) => f.name === '@template-x-carousel-toolbar-search-bar');
const SEARCH_TERM = 'birthday';

test.describe('TemplateXCarouselToolbar signed-in test suite', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), 'No signed-in session (set IMS_EMAIL / IMS_PASS or run `npm run nala:login`)');
    // Block test hook: capture the redirect instead of leaving the page.
    await page.addInitScript(() => {
      window.t_locationAssign = (url) => { window.nalaRedirectUrl = url; };
    });
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
