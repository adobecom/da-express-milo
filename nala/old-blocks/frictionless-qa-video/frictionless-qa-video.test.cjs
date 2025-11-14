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
});
