const { test } = require('../../utils/test.cjs');
const { features } = require('./susi-light.spec.cjs');
const { hasAuthState } = require('../../libs/ims-login.cjs');

const miloLibs = process.env.MILO_LIBS || '';
// susi-light redirects signed-in users to its destination URL (the Express
// app; rewritten to stage.projectx on non-prod). Stub it so the app is not loaded.
const DESTINATION_HOSTS = /^(new\.express\.adobe\.com|express\.adobe\.com|stage\.projectx\.corp\.adobe\.com)$/;

test.describe('SusiLightBlock signed-in test suite', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasAuthState(), 'No signed-in session (set IMS_EMAIL / IMS_PASS or run `npm run nala:login`)');
    await page.route((url) => DESTINATION_HOSTS.test(url.hostname), (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>nala-susi-destination</body></html>' }));
  });

  for (const feature of features.slice(0, 2)) {
    test(`[Test Id - ${feature.tcid}] ${feature.name} signed-in redirect @login ${feature.tags}`, async ({ page, baseURL }) => {
      const testUrl = `${baseURL}${feature.path}${miloLibs}`;
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Signed-in user is redirected to the app', async () => {
        await page.goto(testUrl);
        // Query params vary (tracking appends url/locale/contentRegion), so
        // only the destination host is asserted.
        await page.waitForURL((url) => DESTINATION_HOSTS.test(url.hostname), { timeout: 30000 });
      });
    });
  }
});
