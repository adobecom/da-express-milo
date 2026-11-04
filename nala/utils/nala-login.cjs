#!/usr/bin/env node
/**
 * Manual IMS login for Nala `@login` tests (fallback when IMS_EMAIL/IMS_PASS
 * are not available, or IMS shows a challenge to automated logins).
 *
 * Opens a headed browser, lets you sign in by hand, verifies the session is
 * recognised by the Express page, then saves it to nala/.auth/user.json
 * (git-ignored) for the express-login-chromium project to reuse.
 *
 * Usage:
 *   npm run nala:login                     # main--da-express-milo--adobecom.aem.live
 *   npm run nala:login <branch|local>      # e.g. stage, local
 */
const { chromium } = require('@playwright/test');
const { getLocalTestLiveUrl } = require('./nala.run.cjs');
const {
  AUTH_FILE, LOGIN_START_PATH, writeAuthState, isSignedIn,
} = require('../libs/ims-login.cjs');

(async () => {
  const env = process.argv[2] || 'main';
  const startUrl = `${getLocalTestLiveUrl(env)}${LOGIN_START_PATH}`;

  console.log('\n--- Nala IMS Login ---\n');
  console.log(`1. A browser will open to ${startUrl}`);
  console.log('2. Click "Sign In" and complete the Adobe (stage) login');
  console.log('3. Come back here and press ENTER once login is complete\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(startUrl);

  await new Promise((resolve) => {
    process.stdout.write('Press ENTER after login is complete... ');
    process.stdin.once('data', resolve);
  });

  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
  if (!await isSignedIn(page, 30000)) {
    console.error(`\nNot signed in on ${startUrl} — session NOT saved. Please try again.`);
    await browser.close();
    process.exit(1);
  }

  writeAuthState(await context.storageState());
  console.log(`\nSession saved to: ${AUTH_FILE}`);
  console.log('Run the login tests with:\n');
  console.log(`  npm run nala ${env} project=express-login-chromium\n`);

  await browser.close();
  process.exit(0);
})();
