const { readFileSync } = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const { test: base, expect, devices } = require('../../utils/test.cjs');
const { features, assets, fallback } = require('./frictionless-quick-action-mobile.spec.cjs');
const FrictionlessQuickActionMobile = require('./frictionless-quick-action-mobile.page.cjs');
const { runAccessibilityTest } = require('../../libs/accessibility.cjs');
const { runSeoChecks } = require('../../libs/seo-check.cjs');

// The approved H.264 fixture needs Chrome, not Playwright's codec-limited Chromium.
// Extend the shared test so tracker blocking and every project's device settings survive.
const test = base.extend({
  channel: [async ({ browserName, channel }, use) => {
    await use(browserName === 'chromium' ? 'chrome' : channel);
  }, { scope: 'worker' }],
});

const miloLibs = process.env.MILO_LIBS || '';
const imagePath = path.resolve(process.cwd(), assets.image);
const videoPath = path.resolve(process.cwd(), assets.video);
const imageBytes = readFileSync(imagePath);
const videoBytes = readFileSync(videoPath);
const invalidFile = { name: 'unsupported.txt', mimeType: 'text/plain', buffer: Buffer.from('Not an image or video.') };
const normalizedText = (text) => text.replace(/[\u2011\u2013\u2014]/g, '-');

async function openFixture(page, baseURL, feature) {
  const block = new FrictionlessQuickActionMobile(page, feature.selector);
  await block.installSDKStub();
  await page.goto(`${baseURL}${feature.path}${miloLibs}`, { waitUntil: 'domcontentloaded' });
  return block;
}

async function verifyFallback(page) {
  const heading = page.locator('main h1');
  await expect.poll(async () => normalizedText(await heading.innerText())).toBe(fallback.heading);
  await expect(page.locator('main')).toContainText(fallback.description);
  await expect(page.locator('main')).toContainText(fallback.destination);
  const link = page.getByRole('link', { name: fallback.link });
  await expect(link).toHaveAttribute('href', features[0].path);
  await expect.poll(() => page.locator('main img').first().evaluate((img) => img.naturalWidth)).toBe(301);
}

async function verifyLanding(page, block, data) {
  await expect(block.block).toHaveAttribute('data-frictionlesstype', data.action);
  await expect(block.block).toHaveAttribute('data-frictionlessgroup', data.group);
  for (const text of data.semantic.texts) {
    await expect(block.block.locator(text.selector)).toContainText(text.text);
  }
  for (const media of data.semantic.media) {
    const element = block.block.locator(media.selector);
    if (media.alt) {
      await expect(element).toHaveAttribute('alt', media.alt);
      await expect.poll(() => element.evaluate((img) => img.naturalWidth)).toBe(media.width);
    }
  }
  for (const interactive of data.semantic.interactives) {
    const element = block.block.locator(interactive.selector).nth(interactive.nth || 0);
    await expect(element).toBeVisible();
    await expect(element).toHaveText(interactive.text);
    if (interactive.href) await expect(element).toHaveAttribute('href', interactive.href);
  }
  const accept = (await block.input.getAttribute('accept')).split(',').map((type) => type.trim());
  expect(accept).toEqual(data.accept);
  await expect(block.input).toHaveJSProperty('multiple', data.action === 'merge-videos');
  await expect(page.locator('main')).not.toContainText(fallback.heading);
  if (data.action === 'caption-video') {
    const [media] = data.semantic.media;
    const playback = await block.introPlayback();
    expect(playback).toMatchObject({
      ended: true, width: media.width, loop: false, muted: true, autoplay: true, playsInline: true, error: null,
    });
    expect(playback.duration).toBeGreaterThan(media.duration);
    expect(playback.currentTime).toBeCloseTo(playback.duration, 1);
    expect(playback.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'playing', trusted: true }),
      expect.objectContaining({ type: 'timeupdate', trusted: true, time: expect.any(Number) }),
      expect.objectContaining({ type: 'ended', trusted: true }),
    ]));
  }
}

async function assertSDKCall(block, action, method, count = 1) {
  await expect.poll(async () => (await block.sdkState()).calls.length).toBe(count);
  const state = await block.sdkState();
  expect(state.initializations).toEqual([{
    hostInfo: { clientId: 'AdobeExpressWeb', appName: 'express' },
    configParams: { locale: 'en_US', env: 'prod', skipBrowserSupportCheck: true },
    auth: { mode: 'delayed' },
  }]);
  const call = state.calls[count - 1];
  expect(call.method).toBe(method);
  expect(call.container).toEqual({
    mode: 'inline', parentElementId: `${action}-container`, backgroundColor: 'transparent', hideCloseButton: true, padding: 0,
  });
  expect(call.app).toMatchObject({
    metaData: { workflowStartTimeStamp: expect.any(Number), isFrictionlessQa: 'true' },
    analyticsData: {},
    receiveQuickActionErrors: true,
    callbacks: ['onCancel', 'onError', 'onIntentChange'],
  });
  expect(call.app.metaData.workflowStartTimeStamp).toBeGreaterThan(0);
  const userAgent = await block.page.evaluate(() => navigator.userAgent);
  const safari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  expect(call.exports.map((option) => option.action.target)).toEqual(safari ? ['download'] : ['download', 'express']);
  expect(call.exports[0]).toMatchObject({
    id: 'downloadExportOption',
    style: { uiType: 'button', variant: safari ? 'accent' : 'secondary' },
    buttonStyle: { treatment: 'fill', size: 'xl' },
  });
  await expect(block.block.locator(`#${action}-container`)).toHaveCount(1);
  await expect(block.block.locator(`#${action}-container .nala-sdk-stub`)).toBeVisible();
  return call;
}

function assertVideoAsset(asset, bytes = videoBytes, name = 'test-video.mp4', type = 'video/mp4') {
  expect(asset).toEqual({
    name,
    type: 'video',
    dataType: 'blob',
    data: {
      name, type, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), originalSelection: true,
    },
  });
}

async function assertNoWarmup(block) {
  expect((await block.sdkState()).warmups).toEqual([]);
}

async function exerciseCrop(page, block, data, lifecycle) {
  await expect.poll(async () => (await block.sdkState()).warmups.length).toBe(1);
  expect((await block.sdkState()).warmups[0]).toEqual({
    action: 'crop-image',
    mode: 'preload',
    container: {
      mode: 'inline', parentElementId: 'crop-image-container', backgroundColor: 'transparent', hideCloseButton: true, padding: 0,
    },
  });
  const warmed = await block.block.locator('#crop-image-container').elementHandle();
  await expect(block.block.locator('#crop-image-container')).toHaveClass(/hidden/);
  expect(await block.chooseFiles(imagePath)).toBe(false);
  let call = await assertSDKCall(block, 'crop-image', 'cropImage');
  expect(call.documentConfig).toEqual({
    asset: { type: 'image', dataType: 'base64', data: `data:image/png;base64,${imageBytes.toString('base64')}` },
  });
  expect(await warmed.evaluate((element) => element === document.getElementById('crop-image-container'))).toBe(true);
  await expect(block.heading).toHaveText(data.postUploadHeading);
  await expect(block.upload).toBeHidden();
  if (!lifecycle) return;

  await block.invokeSDKCallback('onError', { _customData: 'Simulated processing failure.' });
  await expect(block.toast).toHaveText('Simulated processing failure. Please try again.');
  await expect(block.upload).toBeVisible();
  await expect(block.heading).toHaveText(data.semantic.texts[0].text);
  await expect(block.block.locator('#crop-image-container')).toHaveCount(0);
  await page.goBack();
  await expect(block.input).toHaveValue('');
  await block.chooseFiles(imagePath);
  call = await assertSDKCall(block, 'crop-image', 'cropImage', 2);
  expect(call.documentConfig.asset.data).toBe(`data:image/png;base64,${imageBytes.toString('base64')}`);
  const intent = await block.invokeSDKCallback('onIntentChange');
  expect(intent).toEqual({ containerConfig: { mode: 'modal', zIndex: 999 } });
  await expect(page.locator('body')).toHaveClass(/editor-modal-loaded/);
  await expect(block.upload).toBeVisible();
  await block.invokeSDKCallback('onCancel');
  await expect(page.locator('body')).not.toHaveClass(/editor-modal-loaded/);
  await expect(page.locator('body')).toHaveAttribute('data-suppressfloatingcta', 'false');
  await expect(block.input).toHaveValue('');
  await block.chooseFiles(imagePath);
  await assertSDKCall(block, 'crop-image', 'cropImage', 3);
}

async function exerciseCaption(page, block, data) {
  await expect(block.combobox).toHaveText('English (US)');
  await expect(block.combobox).toHaveAttribute('data-value', 'en-us');
  await block.combobox.click();
  await expect(block.block.getByRole('option')).toHaveCount(18);
  await runAccessibilityTest({ page, testScope: block.block });
  await block.block.getByRole('option', { name: data.language.pointer, exact: true }).click();
  await expect(block.combobox).toHaveText(data.language.pointer);
  await block.combobox.press('ArrowDown');
  await block.combobox.press('Home');
  await block.combobox.press('f');
  await block.combobox.press('Enter');
  await expect(block.combobox).toHaveText(data.language.keyboard);
  await expect(block.combobox).toHaveAttribute('data-value', data.language.code);
  await expect(block.combobox).toHaveAttribute('aria-expanded', 'false');
  expect(await block.chooseFiles(videoPath)).toBe(false);
  const call = await assertSDKCall(block, data.action, 'captionVideo');
  expect(call.app.metaData.videoLanguage).toBe(data.language.code);
  assertVideoAsset(call.documentConfig.asset);
  await expect(block.heading).toHaveText(data.postUploadHeading);
  await expect(block.combobox).toBeHidden();
  await assertNoWarmup(block);
}

async function exerciseMerge(block, files = [videoPath, imagePath]) {
  expect(await block.chooseFiles(files)).toBe(true);
  const call = await assertSDKCall(block, 'merge-videos', 'mergeVideos');
  expect(call.documentConfig.assets).toHaveLength(2);
  assertVideoAsset(call.documentConfig.assets[0]);
  // The host currently labels every merge asset "video", including image Files.
  assertVideoAsset(call.documentConfig.assets[1], imageBytes, 'test-image.png', 'image/png');
  await assertNoWarmup(block);
}

async function exerciseQR(page, block, data) {
  let fileChoosers = 0;
  page.on('filechooser', () => { fileChoosers += 1; });
  await block.upload.click();
  const call = await assertSDKCall(block, data.action, 'generateQRCode');
  expect(call.documentConfig).toEqual({});
  await expect(block.heading).toHaveText(data.postUploadHeading);
  await block.invokeSDKCallback('onIntentChange');
  await block.invokeSDKCallback('onCancel');
  await expect(page.locator('body')).not.toHaveClass(/editor-modal-loaded/);
  await block.upload.press('Enter');
  const repeated = await assertSDKCall(block, data.action, 'generateQRCode', 2);
  expect(repeated.documentConfig).toEqual({});
  expect(fileChoosers).toBe(0);
  await assertNoWarmup(block);
}

async function exercisePicker(page, block, data, ios) {
  await block.chooseFiles(videoPath);
  await assertNoWarmup(block);
  if (!ios) {
    // edit-video has no direct SDK dispatch. Do not pretend this branch processes files.
    await expect(block.block.locator('#edit-video-container')).toBeVisible();
    await expect(block.heading).toHaveText(data.postUploadHeading);
    expect((await block.sdkState()).calls).toEqual([]);
    await expect(block.dialog).toHaveCount(0);
    return;
  }
  await expect(block.dialog).toBeVisible();
  await expect(block.closePicker).toBeFocused();
  await expect.poll(() => block.preview.evaluate((video) => video.videoWidth)).toBe(1126);
  await expect.poll(() => block.preview.evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);
  await expect(block.preview).toBeVisible();
  await expect(block.preview).toHaveJSProperty('error', null);
  await expect(block.preview).toHaveAttribute('src', /^blob:/);
  await expect.poll(() => block.dialog.locator('.vqap-action-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label')))).toEqual(data.pickerActions);
  await expect(block.dialog.locator('.vqap-badge')).toHaveText(data.pickerBadge);
  await expect(block.dialog.getByRole('button', { name: 'Convert to MP4', exact: true })).toHaveCount(0);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  expect((await block.sdkState()).initializations).toEqual([]);
  await runAccessibilityTest({ page, testScope: block.dialog });
  await page.keyboard.press('Escape');
  await expect(block.dialog).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await block.chooseFiles(videoPath);
  await expect(block.dialog.getByRole('button', { name: 'Trim video', exact: true })).toBeVisible();
  await block.closePicker.click();
  await expect(block.dialog).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  await block.chooseFiles(videoPath);
  await block.dialog.getByRole('button', { name: 'Trim video', exact: true }).click();
  const call = await assertSDKCall(block, 'trim-video', 'trimVideo');
  assertVideoAsset(call.documentConfig.asset);
  await expect(block.dialog).toHaveCount(0);
  await expect(block.block.locator('.dropzone-container')).toHaveClass(/hidden/);
  await block.invokeSDKCallback('onError', { _customData: 'Simulated processing failure.' });
  await expect(block.upload).toBeVisible();
  await block.chooseFiles(videoPath);
  await block.dialog.getByRole('button', { name: 'Edit video', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${fallback.path}#app-install-fixture$`));
  await verifyFallback(page);
  await runAccessibilityTest({ page, testScope: 'main' });
}

test.describe('Frictionless quick action mobile: real host UI, simulated processing SDK', () => {
  for (const feature of features) {
    test(`[Test Id - ${feature.tcid}] ${feature.name} ${feature.tags.join(' ')}`, async ({ page, baseURL, userAgent }) => {
      const { data } = feature;
      const android = /Android/.test(userAgent);
      const ios = /iPhone|iPad|iPod/.test(userAgent);
      const legacyFallback = !data.modern && !android;
      let block;
      await test.step('Navigate using the project device and intercept only the processing SDK', async () => {
        block = await openFixture(page, baseURL, feature);
        await expect(page).toHaveURL(`${baseURL}${feature.path}${miloLibs}`);
      });
      await test.step('Verify authored semantics, platform metadata and natural intro transition', async () => {
        await expect(page).toHaveTitle(data.title);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
        const platformMetadata = page.locator('meta[name="frictionless-safari"]');
        if (data.modern) await expect(platformMetadata).toHaveAttribute('content', 'on');
        else await expect(platformMetadata).toHaveCount(0);
        if (legacyFallback) {
          await expect(block.block).toHaveCount(0);
          await verifyFallback(page);
        } else {
          await verifyLanding(page, block, data);
        }
      });
      await test.step('Check real host accessibility with no exclusions or skipped states', async () => {
        await runAccessibilityTest({ page, testScope: legacyFallback ? 'main' : block.block });
      });
      await test.step('Check fixture SEO', async () => {
        await runSeoChecks({ page, feature });
      });
      await test.step('Exercise genuine chooser, picker, language, history and SDK boundary', async () => {
        if (legacyFallback) {
          expect(await block.sdkState()).toEqual({ initializations: [], warmups: [], calls: [] });
          await page.getByRole('link', { name: fallback.link }).click();
          await expect(page).toHaveURL(new RegExp(`${features[0].path}$`));
          await expect(block.upload).toBeVisible();
        } else if (data.action === 'crop-image') {
          await exerciseCrop(page, block, data, data.modern);
        } else if (data.action === 'caption-video') {
          await exerciseCaption(page, block, data);
        } else if (data.action === 'merge-videos') {
          await exerciseMerge(block);
        } else if (data.action === 'generate-qr-code') {
          await exerciseQR(page, block, data);
        } else {
          await exercisePicker(page, block, data, ios);
        }
      });
    });
  }

  test('Crop rejects unsupported MIME and files over 40 MiB before SDK processing @frictionless-quick-action-mobile @express', async ({ page, baseURL }) => {
    const block = await openFixture(page, baseURL, features[0]);
    await expect(block.upload).toBeVisible();
    await block.chooseFiles(invalidFile);
    await expect(block.toast).toContainText(/support/i);
    expect((await block.sdkState()).calls).toEqual([]);
    await block.chooseFiles({
      name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(40 * 1024 * 1024 + 1),
    });
    await expect(block.toast).toContainText(/size|large|40/i);
    await expect(block.heading).toHaveText(features[0].data.semantic.texts[0].text);
    expect((await block.sdkState()).calls).toEqual([]);
    await block.chooseFiles(imagePath);
    await assertSDKCall(block, 'crop-image', 'cropImage');
  });

  test('Merge rejects an invalid first file but filters later invalid files @frictionless-quick-action-mobile @express', async ({ page, baseURL }) => {
    const block = await openFixture(page, baseURL, features[3]);
    await expect(block.upload).toBeVisible();
    await block.chooseFiles([invalidFile, {
      name: 'test-image.png', mimeType: 'image/png', buffer: imageBytes,
    }]);
    await expect(block.toast).toContainText(/support/i);
    expect((await block.sdkState()).calls).toEqual([]);
    await exerciseMerge(block, [
      { name: 'test-video.mp4', mimeType: 'video/mp4', buffer: videoBytes },
      invalidFile,
      { name: 'test-image.png', mimeType: 'image/png', buffer: imageBytes },
    ]);
    await expect(block.toast).toContainText(/support/i);
  });

  // Default CI selects desktop projects. Add explicit mobile-UA cases without
  // replacing the native project/device coverage above or changing shared CI.
  for (const device of ['Pixel 5', 'iPhone 12']) {
    test.describe(`${device} platform branch on every browser engine`, () => {
      test.use({ userAgent: devices[device].userAgent });
      test(`Mobile-only ${device} branch @frictionless-quick-action-mobile @express`, async ({ page, baseURL }) => {
        const ios = device === 'iPhone 12';
        const feature = features[ios ? 5 : 1];
        const block = await openFixture(page, baseURL, feature);
        await verifyLanding(page, block, feature.data);
        await runAccessibilityTest({ page, testScope: block.block });
        await runSeoChecks({ page, feature });
        if (ios) await exercisePicker(page, block, feature.data, true);
        else await exerciseCrop(page, block, feature.data, false);
      });
    });
  }
});
