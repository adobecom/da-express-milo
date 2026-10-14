const { test, expect } = require('../../utils/test.cjs');
const GnavProfile = require('../../libs/gnav-profile.page.cjs');
const {
  ImsLogin, LOGIN_START_PATH, EMPTY_STORAGE_STATE, hasCredentials, stubImsRedirectTargets, isSignedIn,
} = require('../../libs/ims-login.cjs');

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express IMS sign-in test suite', () => {
  // Exercises the full sign-in UI flow, so start without the shared session.
  test.use({ storageState: EMPTY_STORAGE_STATE });

  test.beforeEach(() => {
    test.skip(!hasCredentials(), 'IMS_EMAIL / IMS_PASS not set');
  });

  test('@ims-login Sign in from gnav @login @express @smoke', async ({ page, baseURL }) => {
    test.setTimeout(180000);
    const testUrl = `${baseURL}${LOGIN_START_PATH}${miloLibs}`;
    const gnav = new GnavProfile(page);
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('step-1: Go to page as a signed-out user', async () => {
      await stubImsRedirectTargets(page);
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(gnav.signInButton).toBeVisible({ timeout: 20000 });
    });

    await test.step('step-2: Sign in via gnav "Sign In"', async () => {
      await gnav.signInButton.click();
      await page.waitForURL(/(services\.adobe\.com|adobelogin\.com)/, { timeout: 30000 });
      await new ImsLogin(page).loginOnAppForm();
    });

    await test.step('step-3: Verify signed-in gnav profile', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      expect(await isSignedIn(page, 30000)).toBe(true);
      await expect(gnav.signInButton).toBeHidden();
      await gnav.openUserProfile();
      await gnav.checkUserProfile();
      // The gnav truncates long emails ("abc…@x.com"), so match the visible
      // start and end against IMS_EMAIL.
      const shownEmail = (await gnav.profileEmail.textContent()).trim().toLowerCase();
      const [shownStart, shownEnd = ''] = shownEmail.split('…');
      const expectedEmail = process.env.IMS_EMAIL.toLowerCase();
      expect(expectedEmail.startsWith(shownStart), `profile email "${shownEmail}"`).toBe(true);
      expect(expectedEmail.endsWith(shownEnd), `profile email "${shownEmail}"`).toBe(true);
    });
  });
});
