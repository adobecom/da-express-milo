const assert = require('assert/strict');
const { readFileSync } = require('fs');
const { chromium, firefox, webkit } = require('@playwright/test');
const { version } = require('@playwright/test/package.json');
const lock = require('../../package-lock.json');

async function verifyVideo(page) {
  const video = readFileSync('nala/assets/test-video.mp4');
  await page.route('http://nala-ci.test/**', (route) => route.fulfill(
    route.request().url().endsWith('/fixture.mp4')
      ? { contentType: 'video/mp4', body: video }
      : { contentType: 'text/html', body: '<!doctype html><html><body></body></html>' },
  ));
  await page.goto('http://nala-ci.test/');
  const decoded = await page.evaluate(async () => {
    const element = document.createElement('video');
    element.muted = true;
    document.body.append(element);
    if (!element.canPlayType('video/mp4; codecs="avc1.42E01E"')) {
      throw new Error('Chrome does not advertise H.264 support');
    }
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('H.264 frame decoding timed out')), 15000);
      element.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(new Error(`H.264 media error: ${element.error.message}`));
      }, { once: true });
      element.requestVideoFrameCallback((time, metadata) => {
        clearTimeout(timeout);
        element.pause();
        resolve({ width: element.videoWidth, height: element.videoHeight, frames: metadata.presentedFrames });
      });
      element.src = 'http://nala-ci.test/fixture.mp4';
      element.play().catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  });
  assert.ok(decoded.width > 0 && decoded.height > 0 && decoded.frames > 0, 'Chrome must decode an H.264 frame');
  console.log('Chrome decoded the approved H.264 fixture:', decoded);
}

async function verifyBrowsers() {
  assert.equal(process.getuid(), 1001, 'Nala browsers must run as UID 1001, not root');
  assert.equal(version, lock.packages['node_modules/@playwright/test'].version, 'Playwright must match the lockfile');
  assert.equal(process.env.NALA_PLAYWRIGHT_VERSION, version, 'Rebuild the Nala image and update both workflow digests after a Playwright upgrade');

  for (const [name, type, options] of [
    ['Chromium', chromium, {}],
    ['Firefox', firefox, {}],
    ['WebKit', webkit, {}],
    ['Chrome', chromium, { channel: 'chrome' }],
  ]) {
    const browser = await type.launch(options);
    try {
      const page = await browser.newPage();
      assert.equal(await page.evaluate(() => 1 + 1), 2);
      if (name === 'Chrome') await verifyVideo(page);
      console.log(`${name} ${browser.version()} launched successfully as UID ${process.getuid()}`);
    } finally {
      await browser.close();
    }
  }
}

verifyBrowsers().catch((error) => {
  console.error('Nala container browser verification failed:', error);
  process.exitCode = 1;
});
