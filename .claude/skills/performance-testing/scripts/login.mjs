#!/usr/bin/env node
/**
 * login.mjs
 *
 * One-time interactive login for IMS/Adobe-SSO-gated URLs (e.g. `.aem.page`
 * stage previews, which 401 without a login — there's no static credential
 * or API key for this, just the same SSO redirect you'd hit opening the URL
 * in your own browser).
 *
 * Opens a real, visible browser window, lets you log in exactly like you
 * normally would, then saves the resulting session (cookies + localStorage)
 * to .auth-state.json (gitignored) so compare.mjs can reuse it in every
 * throttled, headless measurement run afterward without re-authenticating.
 *
 * Usage:
 *   node login.mjs <url-that-currently-401s>
 *
 * Re-run this whenever compare.mjs reports a run stopped early with a 401 —
 * that means the saved session expired.
 */

import readline from 'node:readline/promises';
import { AUTH_STATE_PATH } from './lib/auth.mjs';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node login.mjs <url-that-currently-401s>');
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      '\nError: playwright is not installed.\n' +
        'Install it in an environment with network access:\n\n' +
        '  npm install playwright && npx playwright install chromium\n',
    );
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url).catch(() => {});

  console.log('\nA browser window has opened. Log in with your Adobe account (IMS/SSO)');
  console.log('the same way you normally would when this page prompts you, then come');
  console.log('back here.\n');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await rl.question('Press Enter once you are logged in and can see the real page... ');
  rl.close();

  // Verify the login actually worked before saving — don't silently write a
  // session that still 401s.
  const response = await page.goto(url, { waitUntil: 'load' }).catch(() => null);
  if (!response || !response.ok()) {
    console.error(
      `\nStill getting ${response ? response.status() : 'a load error'} after login — not saving anything. Try again.`,
    );
    await browser.close();
    process.exit(1);
  }

  await context.storageState({ path: AUTH_STATE_PATH });
  await browser.close();
  console.log(`\nLogged in. Session saved to ${AUTH_STATE_PATH} (gitignored, stays local).`);
  console.log('compare.mjs will reuse it automatically from now on — no flag needed.');
}

main().catch((e) => {
  console.error('\nUnexpected error:', e);
  process.exit(1);
});
