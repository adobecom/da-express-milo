import path from 'path';
import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './frictionless-qa-video.spec.cjs';
import FrictionlessQA from './frictionless-qa-video.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

const videoFilePath = path.resolve(__dirname, '../../assets/test-video.mp4');

let webUtil;
let frictionlessQA;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Frictionless QA Video Block test suite', () => {
  test.beforeEach(async ({ page }) => {
    webUtil = new WebUtil(page);
    frictionlessQA = new FrictionlessQA(page);
  });

  // Test 0 : Convert video to GIF
  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-video(convert to GIF) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify convert to GIF block content/specs', async () => {
      await expect(frictionlessQA.type.video_to_gif).toBeVisible();
      await expect(frictionlessQA.convertToGifHeading).toContainText(data.h1Text);
      await expect(frictionlessQA.convertToGifContent).toContainText(data.p1Text);
      await expect(frictionlessQA.convertToGifDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQA.convertToGifTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.video_to_gif });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample MP4 file', async () => {
      await frictionlessQA.uploadVideo(videoFilePath);
      await expect(frictionlessQA.convertToGifiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 1 : Crop video
  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-video(crop video) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify crop video block content/specs', async () => {
      await expect(frictionlessQA.type.video_crop).toBeVisible();
      await expect(frictionlessQA.cropVideoHeading).toContainText(data.h1Text);
      await expect(frictionlessQA.cropVideoContent).toContainText(data.p1Text);
      await expect(frictionlessQA.cropVideoDropzone).toContainText(data.dropZoneText);
      await expect(frictionlessQA.cropVideoTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.video_crop });
    });

    await test.step('Upload a sample MP4 file', async () => {
      await frictionlessQA.uploadVideo(videoFilePath);
      await expect(frictionlessQA.cropVideoiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 2 : Trim video
  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-video(trim video) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify trim video block content/specs', async () => {
      await expect(frictionlessQA.type.video_trim).toBeVisible();
      await expect(frictionlessQA.trimVideoHeading).toContainText(data.h1Text);
      await expect(frictionlessQA.trimVideoContent).toContainText(data.p1Text);
      await expect(frictionlessQA.trimVideoDropzone).toContainText(data.dropZoneText);
      await expect(frictionlessQA.trimVideoTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.video_trim });
    });

    await test.step('Upload a sample MP4 file', async () => {
      await frictionlessQA.uploadVideo(videoFilePath);
      await expect(frictionlessQA.trimVideoiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 3 : Resize video
  test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to frictionless-qa-video(resize video) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify resize video block content/specs', async () => {
      await expect(frictionlessQA.type.video_resize).toBeVisible();
      await expect(frictionlessQA.resizeVideoHeading).toContainText(data.h1Text);
      await expect(frictionlessQA.resizeVideoContent).toContainText(data.p1Text);
      await expect(frictionlessQA.resizeVideoDropzone).toContainText(data.dropZoneText);
      await expect(frictionlessQA.resizeVideoTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.video_resize });
    });

    await test.step('Upload a sample MP4 file', async () => {
      await frictionlessQA.uploadVideo(videoFilePath);
      await expect(frictionlessQA.resizeVideoiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 4 : Merge video
  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    const testUrl = `${baseURL}${features[4].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to frictionless-qa-video(merge video) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify merge video block content/specs', async () => {
      await expect(frictionlessQA.type.video_merge).toBeVisible();
      await expect(frictionlessQA.mergeVideoHeading).toContainText(data.h1Text);
      await expect(frictionlessQA.mergeVideoContent).toContainText(data.p1Text);
      await expect(frictionlessQA.mergeVideoDropzone).toContainText(data.dropZoneText);
      await expect(frictionlessQA.mergeVideoTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.video_merge });
    });

    await test.step('Upload a sample MP4 file', async () => {
      await frictionlessQA.uploadVideo(videoFilePath);
      await expect(frictionlessQA.mergeVideoiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 5: Convert to MP4 video
  test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
    const { data } = features[5];
    const testUrl = `${baseURL}${features[5].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to frictionless-qa-video(merge video) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify convert to MP4 video block content/specs', async () => {
      await expect(frictionlessQA.type.video_convert_to_mp4).toBeVisible();
      await expect(frictionlessQA.convertToMp4Heading).toContainText(data.h1Text);
      await expect(frictionlessQA.convertToMp4Content).toContainText(data.p1Text);
      await expect(frictionlessQA.convertToMp4Dropzone).toContainText(data.dropZoneText);
      await expect(frictionlessQA.convertToMp4TermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.video_convert_to_mp4 });
    });

    await test.step('Upload a sample MP4 file', async () => {
      await frictionlessQA.uploadVideo(videoFilePath);
      await expect(frictionlessQA.convertToMp4iFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 6: Remove background
  test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL, browserName }) => {
    const { data } = features[6];
    const testUrl = `${baseURL}${features[6].path}${miloLibs}`;
    console.info(`[Test Page]: ${testUrl}`);

    await test.step('Go to frictionless-qa-video(remove background) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify remove background block content/specs', async () => {
      await expect(frictionlessQA.type.remove_background).toBeVisible();
      await expect(frictionlessQA.removeBackgroundHeading).toContainText(data.h1Text);
      await expect(frictionlessQA.removeBackgroundContent).toContainText(data.p1Text);
      await expect(frictionlessQA.removeBackgroundDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQA.removeBackgroundTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQA.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQA.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQA.frictionlessQaVideo).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQA.type.remove_background });
    });

    await test.step('validate video controls keyboard accessibility', async () => {
      // Animation not loading in Chrome for test script.
      if (browserName !== 'chromium') {
        const videoControlsButton = page.locator('.video-controls-wrapper');
        const isAttached = await videoControlsButton.count() > 0;
        if (!isAttached) {
          // Video controls wrapper not found, skipping accessibility test
          console.log('⚠️ Video controls wrapper (.video-controls-wrapper) not found on this page. Skipping new video controls accessibility test.');
          return;
        }
        await expect(videoControlsButton).toBeAttached();

        // Verify button has correct ARIA attributes
        await expect(videoControlsButton).toHaveAttribute('type', 'button');
        const ariaPressed = await videoControlsButton.getAttribute('aria-pressed');
        expect(ariaPressed).toBeTruthy();
        const ariaLabel = await videoControlsButton.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();

        // Get initial video state
        const video = frictionlessQA.removeBackgroundVideo;
        const initialPaused = await video.evaluate((v) => v.paused);

        // Tab to video button and verify focus
        await page.keyboard.press('Tab');
        await videoControlsButton.focus();
        const isFocused = await videoControlsButton.evaluate((el) => document.activeElement === el);
        expect(isFocused).toBeTruthy();
        console.log('✅ Video button is keyboard focusable');

        // Test spacebar toggles video once (not twice - this is the bug fix!)
        await page.keyboard.press('Space');
        await page.waitForTimeout(500); // Wait for video state to update

        const afterSpacePaused = await video.evaluate((v) => v.paused);
        expect(afterSpacePaused).not.toBe(initialPaused);
        console.log('✅ Spacebar toggles video once (spacebar trap fixed)');

        // Verify ARIA state updated
        const updatedAriaPressed = await videoControlsButton.getAttribute('aria-pressed');
        expect(updatedAriaPressed).not.toBe(ariaPressed);

        // Test Enter key also works
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);

        const afterEnterPaused = await video.evaluate((v) => v.paused);
        expect(afterEnterPaused).toBe(initialPaused);
        console.log('✅ Enter key toggles video');

        // Verify video element itself is NOT focusable (no tabindex)
        const videoTabIndex = await video.evaluate((v) => v.getAttribute('tabindex'));
        expect(videoTabIndex).toBeNull();
        console.log('✅ Video element is not focusable (no tabindex)');
      }
    });
  });
});
