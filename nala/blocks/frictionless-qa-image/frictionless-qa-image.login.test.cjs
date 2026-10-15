const path = require('path');
const { test, expect } = require('../../utils/test.cjs');
const { features } = require('./frictionless-qa-image.spec.cjs');
const FrictionlessQAImage = require('./frictionless-qa-image.page.cjs');
const { hasAuthState } = require('../../libs/ims-login.cjs');

const pngImageFilePath = path.resolve(process.cwd(), 'nala', 'assets', 'test-image.png');
const miloLibs = process.env.MILO_LIBS || '';
// Signed-in remove-background uploads to Adobe storage before redirecting to
// the editor. Requests are recorded and aborted so no asset is created.
const STORAGE_HOST = /^platform-cs(-stage)?\.adobe\.io$/;

test.describe('Express Frictionless QA Image signed-in test suite', () => {
  test.beforeEach(() => {
    test.skip(!hasAuthState(), 'No signed-in session (set IMS_EMAIL / IMS_PASS or run `npm run nala:login`)');
  });

  test(`${features[0].name} signed-in upload,@login ${features[0].tags}`, async ({ page, baseURL }) => {
    const FrictionlessQAImagePage = FrictionlessQAImage.default || FrictionlessQAImage;
    const frictionlessQAImage = new FrictionlessQAImagePage(page);
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;
    const storageRequests = [];
    console.info(`[Test Page]: ${testUrl}`);

    await page.route((url) => STORAGE_HOST.test(url.hostname), (route) => {
      storageRequests.push(route.request().url());
      return route.abort();
    });

    await test.step('step-1: Go to remove background page as a signed-in user', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(frictionlessQAImage.type.remove_background).toBeVisible();
      await page.waitForFunction(() => window.adobeIMS?.isSignedInUser?.(), null, { timeout: 30000 });
    });

    await test.step('step-2: Upload goes to storage instead of the SDK editor', async () => {
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect.poll(() => storageRequests.length, { timeout: 30000 }).toBeGreaterThan(0);
      await expect(frictionlessQAImage.removeBackgroundiFrame).toHaveCount(0);
    });
  });
});
