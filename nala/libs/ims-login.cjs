/**
 * Adobe IMS login helpers for Nala.
 *
 * Ported from adobecom/milo `nala/features/feds/login/login.page.js` (FedsLogin)
 * and `nala/libs/imslogin.js`, adapted for CommonJS and the Express test env.
 *
 * Note: on `*.aem.live` / localhost, Express runs against IMS *stage*
 * (auth-stg1.services.adobe.com), so IMS_EMAIL / IMS_PASS must be a stage
 * account without 2FA.
 */
const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');
const EMPTY_STORAGE_STATE = { cookies: [], origins: [] };
// Live Express page with the C2 navigation and its sign-in/profile controls.
const LOGIN_START_PATH = '/express/';

// IMS redirects back to its registered redirect_uri (www.stage.adobe.com/home
// for AdobeExpressWeb). That page is not under test and is bot-protected, so it
// is stubbed; only the adobelogin.com session cookies set before it matter.
const IMS_REDIRECT_TARGETS = ['https://www.stage.adobe.com/**', 'https://www.adobe.com/home**'];
// page.route() doesn't intercept redirected requests, so the real redirect
// target still loads. Off the Adobe network (e.g. GitHub runners)
// www.stage.adobe.com is unreachable and the hand-off ends on chrome-error://.
const IMS_REDIRECT_HOST_PATTERN = /^www\.(stage\.)?adobe\.com$/;
const IMS_HOST_PATTERN = /(^|\.)(services\.adobe\.com|adobelogin\.com)$/;
// The SUSI sign-in form host (auth.services / auth-stg1.services). Leaving it
// means credentials were accepted; IMS then hands off via adobeid-*/fromSusi.
const SUSI_FORM_HOST_PATTERN = /^auth(-stg\d+)?\.services\.adobe\.com$/;

function hasCredentials() {
  return Boolean(process.env.IMS_EMAIL && process.env.IMS_PASS);
}

function readAuthState() {
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function hasAuthState() {
  const state = readAuthState();
  return Boolean(state?.cookies?.some((c) => {
    const domain = String(c?.domain || '').toLowerCase().replace(/^\./, '');
    return domain === 'adobelogin.com' || domain.endsWith('.adobelogin.com');
  }));
}

function writeAuthState(state = EMPTY_STORAGE_STATE) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(state, null, 2));
}

async function stubImsRedirectTargets(page) {
  for (const target of IMS_REDIRECT_TARGETS) {
    await page.route(target, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>nala-ims-redirect</body></html>' }));
  }
}

async function waitForIms(page, timeout = 30000) {
  await page.waitForFunction(() => typeof window.adobeIMS?.isSignedInUser === 'function', null, { timeout });
}

/**
 * Resolves true once IMS reports a signed-in user (IMS restores the session
 * from adobelogin.com cookies asynchronously), false if it never does.
 */
async function isSignedIn(page, timeout = 20000) {
  try {
    await waitForIms(page, timeout);
    await page.waitForFunction(() => window.adobeIMS.isSignedInUser(), null, { timeout });
    return true;
  } catch {
    return false;
  }
}

class ImsLogin {
  constructor(page) {
    this.page = page;

    // IMS "APP" login form (auth.services.adobe.com)
    this.emailForm = page.locator('form#EmailForm');
    this.emailField = page.locator('input#EmailPage-EmailField');
    this.emailContinue = page.locator('button[data-id^="EmailPage-ContinueButton"]');
    this.passwordField = page.locator('input#PasswordPage-PasswordField');
    this.passwordContinue = page.locator('button[data-id^="PasswordPage-ContinueButton"]');
    this.personalAccount = page.locator('img[alt="Personal Account"]');
    this.codePadChallenge = page.locator('div[data-id="ChallengeCodePage"]');
  }

  /**
   * Fills the IMS email/password form and waits until IMS redirects away
   * from the login hosts.
   */
  async loginOnAppForm(email = process.env.IMS_EMAIL, password = process.env.IMS_PASS) {
    expect(email, 'ERROR: No environment variable found for IMS_EMAIL').toBeTruthy();
    expect(password, 'ERROR: No environment variable found for IMS_PASS').toBeTruthy();

    await this.emailForm.waitFor({ state: 'visible', timeout: 30000 });
    await this.emailField.fill(email);
    await this.emailContinue.click();

    await this.passwordField.waitFor({ state: 'visible', timeout: 30000 });
    await this.passwordField.fill(password);
    await this.passwordContinue.click();

    const leftSusiForm = () => this.page.waitForURL((url) => !SUSI_FORM_HOST_PATTERN.test(url.hostname), { waitUntil: 'commit', timeout: 45000 });
    const next = await Promise.race([
      leftSusiForm().then(() => 'accepted'),
      // Optional account picker for users with multiple profiles.
      this.personalAccount.first().waitFor({ state: 'visible', timeout: 45000 }).then(() => 'profile'),
      this.codePadChallenge.waitFor({ state: 'visible', timeout: 45000 }).then(() => 'challenge'),
    ]);

    if (next === 'challenge') {
      throw new Error('IMS presented a verification-code challenge. Use a test account without 2FA, or create a session manually with `npm run nala:login`.');
    }
    if (next === 'profile') {
      await this.personalAccount.first().click();
      await leftSusiForm();
    }
    // Let IMS finish its hand-off (sets the adobelogin.com session cookies).
    // Where it lands afterwards does not matter; callers verify the session.
    await this.page.waitForURL((url) => !IMS_HOST_PATTERN.test(url.hostname), { waitUntil: 'commit', timeout: 30000 }).catch(() => {});
    console.info(`[ImsLogin] Credentials accepted for '${email}'.`);
  }
}

/**
 * After `loginOnAppForm()`, waits for the IMS hand-off to finish and then
 * navigates to `url`. Session cookies are set before the redirect target, so
 * where the hand-off ends doesn't matter, but navigating earlier gets
 * interrupted by it.
 */
async function returnAfterImsHandoff(page, url) {
  await page.waitForURL(
    (u) => u.protocol === 'chrome-error:' || IMS_REDIRECT_HOST_PATTERN.test(u.hostname),
    { waitUntil: 'commit', timeout: 30000 },
  ).catch(() => {});
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (e) {
    if (!/interrupted by another navigation/.test(e.message)) throw e;
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
}

/**
 * Signs in through `adobeIMS.signIn()` (independent of the gnav markup),
 * returns to `startUrl`, and verifies IMS restored the session there.
 */
async function signInViaIms(page, startUrl) {
  await stubImsRedirectTargets(page);
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
  await waitForIms(page);
  // Deferred so evaluate() resolves before the page navigates away.
  await page.evaluate(() => { setTimeout(() => window.adobeIMS.signIn(), 0); });
  await page.waitForURL((url) => IMS_HOST_PATTERN.test(url.hostname), { timeout: 30000 });
  await new ImsLogin(page).loginOnAppForm();
  await returnAfterImsHandoff(page, startUrl);
  if (!await isSignedIn(page, 30000)) {
    throw new Error(`IMS login completed but ${startUrl} does not report a signed-in user.`);
  }
}

module.exports = {
  AUTH_FILE,
  LOGIN_START_PATH,
  EMPTY_STORAGE_STATE,
  ImsLogin,
  hasCredentials,
  hasAuthState,
  readAuthState,
  writeAuthState,
  stubImsRedirectTargets,
  returnAfterImsHandoff,
  waitForIms,
  isSignedIn,
  signInViaIms,
};
