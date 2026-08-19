/*
 * Shared Nala test base.
 *
 * Drop-in replacement for `require('@playwright/test')` — re-exports the same
 * `expect` and a `test` whose `page` fixture blocks third-party ad / analytics /
 * social tracker requests before each navigation.
 *
 * Why: block tests verify rendering / content / a11y / behaviour, none of which
 * depends on marketing pixels. In production those trackers load async in the
 * delayed phase and never gate a block. But on CI, 4 parallel headless pages
 * each pulling 40+ third-party requests saturate the shared network and starve
 * the block's own decoration, producing flaky timeouts that only pass on re-run.
 *
 * What this does NOT touch:
 *  - Adobe first-party infra, `instrument.js` + DTM/Launch (so `daa-*` analytics
 *    attributes are still set — no analytics test loses coverage), Adobe Fonts.
 *  - Any functional third-party a block genuinely needs (e.g. the `embed` block's
 *    YouTube/Vimeo, template APIs, SUSI/IMS auth). We block a curated tracker
 *    deny-list ONLY — never a blanket "everything non-Adobe".
 *
 * Tune the list below. Entries match a request host exactly or as a parent
 * domain (`host === h || host.endsWith('.' + h)`), so `doubleclick.net` covers
 * `googleads.g.doubleclick.net` but nothing else.
 */
const base = require('@playwright/test');

const BLOCKED_TRACKER_HOSTS = [
  // Google ads / tag manager (not GA collection the app itself may read back)
  'doubleclick.net',
  'googleadservices.com',
  'googlesyndication.com',
  'googletagmanager.com',
  'google-analytics.com',
  'adservice.google.com',
  // Adobe audience manager (pure tracking; no Nala test depends on it)
  'demdex.net',
  // Ad exchanges / pixels
  'adsrvr.org',
  'tapad.com',
  'flashtalking.com',
  'everesttech.net',
  'everestjs.net',
  'contentsquare.net',
  'ispot.tv',
  // Social trackers — specific tracking hosts only, so functional embeds
  // (youtube/vimeo and, if ever embedded, a social post) are left alone.
  'connect.facebook.net',
  'bat.bing.com',
  'ct.pinterest.com',
  'pinimg.com',
  'px.ads.linkedin.com',
  'licdn.com',
  'analytics.tiktok.com',
  'analytics-ipv6.tiktokw.us',
  'tiktokw.us',
  'tr.snapchat.com',
  'tr6.snapchat.com',
  'sc-static.net',
];

function isBlockedTracker(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return BLOCKED_TRACKER_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

const test = base.test.extend({
  page: async ({ page }, use) => {
    // Registered before the test body, so any test-specific page.route() a block
    // adds later takes precedence for its own URLs and falls through to here for
    // everything else.
    await page.route('**/*', (route) => {
      if (isBlockedTracker(route.request().url())) return route.abort();
      return route.continue();
    });
    await use(page);
  },
});

module.exports = { ...base, test, expect: base.expect, BLOCKED_TRACKER_HOSTS };
