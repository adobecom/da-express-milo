const { test, expect } = require('../../utils/test.cjs');
const GnavProfile = require('../../libs/gnav-profile.page.cjs');
const {
  LOGIN_START_PATH, EMPTY_STORAGE_STATE, hasAuthState, stubImsRedirectTargets, isSignedIn,
} = require('../../libs/ims-login.cjs');

const miloLibs = process.env.MILO_LIBS || '';

// IMS challenges repeated sign-ins (captcha), so credentials are submitted
// only once per run, in auth.setup.cjs. These tests cover the gnav before and
// after that sign-in.
test.describe('Express IMS sign-in test suite', () => {
  test.describe('signed out', () => {
    test.use({ storageState: EMPTY_STORAGE_STATE });

    test('@ims-login-signed-out gnav Sign In opens the IMS sign-in form @login @express @smoke', async ({ page, baseURL }) => {
      const testUrl = `${baseURL}${LOGIN_START_PATH}${miloLibs}`;
      const gnav = new GnavProfile(page);
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Go to page as a signed-out user', async () => {
        await stubImsRedirectTargets(page);
        await page.goto(testUrl);
        await page.waitForLoadState('domcontentloaded');
        await expect(gnav.signInButton).toBeVisible({ timeout: 20000 });
      });

      await test.step('step-2: gnav "Sign In" opens the IMS email form', async () => {
        await gnav.signInButton.click();
        await page.waitForURL((url) => /^auth(-stg\d+)?\.services\.adobe\.com$/.test(url.hostname), { timeout: 30000 });
        await expect(page.locator('input#EmailPage-EmailField')).toBeVisible({ timeout: 30000 });
      });
    });
  });

  test.describe('signed in', () => {
    test.beforeEach(() => {
      test.skip(!hasAuthState(), 'No signed-in session (set IMS_EMAIL / IMS_PASS or run `npm run nala:login`)');
    });

    test('@ims-login-signed-in gnav shows the user profile @login @express @smoke', async ({ page, baseURL }) => {
      const testUrl = `${baseURL}${LOGIN_START_PATH}${miloLibs}`;
      const gnav = new GnavProfile(page);
      console.info(`[Test Page]: ${testUrl}`);

      await test.step('step-1: Go to page as a signed-in user', async () => {
        await page.goto(testUrl);
        await page.waitForLoadState('domcontentloaded');
        expect(await isSignedIn(page, 30000)).toBe(true);
        await expect(gnav.signInButton).toBeHidden();
      });

      await test.step('step-2: Verify gnav profile', async () => {
        await gnav.openUserProfile();
        await gnav.checkUserProfile();
        const expectedEmail = process.env.IMS_EMAIL?.toLowerCase();
        if (!expectedEmail) return;
        // The gnav truncates long emails ("abc…@x.com"), so match the visible
        // start and end against IMS_EMAIL.
        const shownEmail = (await gnav.profileEmail.textContent()).trim().toLowerCase();
        const [shownStart, shownEnd = ''] = shownEmail.split('…');
        expect(expectedEmail.startsWith(shownStart), `profile email "${shownEmail}"`).toBe(true);
        expect(expectedEmail.endsWith(shownEnd), `profile email "${shownEmail}"`).toBe(true);
      });
    });
  });
});
