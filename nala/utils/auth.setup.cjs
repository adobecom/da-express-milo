/**
 * Playwright setup project for `@login` tests (express-login-chromium).
 *
 * - IMS_EMAIL / IMS_PASS set → signs in once and saves the session to
 *   nala/.auth/user.json, which the login project loads as storageState.
 * - Otherwise → keeps an existing nala/.auth/user.json (created manually via
 *   `npm run nala:login`), or writes an empty state so `@login` tests skip.
 */
const { test: setup } = require('@playwright/test');
const {
  AUTH_FILE,
  LOGIN_START_PATH,
  hasCredentials,
  hasAuthState,
  writeAuthState,
  signInViaIms,
} = require('../libs/ims-login.cjs');

// Nala's base reporter requires an `@name` in every test title.
setup('@ims-auth-setup authenticate IMS test user @login', async ({ page, baseURL }) => {
  setup.setTimeout(180000);

  if (!hasCredentials()) {
    if (hasAuthState()) {
      console.info(`[auth.setup] IMS_EMAIL/IMS_PASS not set — reusing saved session: ${AUTH_FILE}`);
    } else {
      console.warn('[auth.setup] No IMS_EMAIL/IMS_PASS and no saved session — @login tests will be skipped. Run `npm run nala:login` to create one.');
      writeAuthState();
    }
    return;
  }

  await signInViaIms(page, `${baseURL}${LOGIN_START_PATH}`);
  writeAuthState(await page.context().storageState());
  console.info(`[auth.setup] IMS session saved to ${AUTH_FILE}`);
});
