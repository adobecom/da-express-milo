import path from 'path';
import fs from 'fs';
import { expect, test } from '@playwright/test';
import WebUtil from '../../libs/webutil.cjs';
import { features } from './frictionless-qa-image.spec.cjs';
import FrictionlessQAImage from './frictionless-qa-image.page.cjs';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';

const pngImageFilePath = path.resolve(process.cwd(), 'nala', 'assets', 'test-image.png');
const jpgImageFilePath = path.resolve(process.cwd(), 'nala', 'assets', 'test-image.jpg');

let webUtil;
let frictionlessQAImage;

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Frictionless QA Image Block test suite', () => {
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(pngImageFilePath)) {
      throw new Error(`Test image not found at ${pngImageFilePath}. Ensure nala/assets/test-image.png exists (run from project root).`);
    }
    webUtil = new WebUtil(page);
    frictionlessQAImage = new FrictionlessQAImage(page);
  });

  // Test 0 : Remove background
  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data } = features[0];
    const testUrl = `${baseURL}${features[0].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (remove background) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify remove background block content/specs', async () => {
      await expect(frictionlessQAImage.type.remove_background).toBeVisible();
      await expect(frictionlessQAImage.removeBackgroundHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.removeBackgroundContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.removeBackgroundDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.removeBackgroundTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.remove_background });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      console.log('Image file path:', pngImageFilePath);
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect(frictionlessQAImage.removeBackgroundiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 1 : Resize image
  test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
    const { data } = features[1];
    const testUrl = `${baseURL}${features[1].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (resize image) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify resize image block content/specs', async () => {
      await expect(frictionlessQAImage.type.resize_image).toBeVisible();
      await expect(frictionlessQAImage.resizeImageHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.resizeImageContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.resizeImageDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.resizeImageTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.resize_image });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect(frictionlessQAImage.resizeImageiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 2 : Convert to JPG
  test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
    const { data } = features[2];
    const testUrl = `${baseURL}${features[2].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (convert to JPG) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify convert to JPG block content/specs', async () => {
      await expect(frictionlessQAImage.type.convert_to_jpg).toBeVisible();
      await expect(frictionlessQAImage.convertToJpgHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.convertToJpgContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.convertToJpgDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.convertToJpgTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.convert_to_jpg });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect(frictionlessQAImage.convertToJpgiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 3 : Convert to PNG
  test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
    const { data } = features[3];
    const testUrl = `${baseURL}${features[3].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (convert to PNG) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify convert to PNG block content/specs', async () => {
      await expect(frictionlessQAImage.type.convert_to_png).toBeVisible();
      await expect(frictionlessQAImage.convertToPngHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.convertToPngContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.convertToPngDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.convertToPngTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.convert_to_png });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      if (!fs.existsSync(jpgImageFilePath)) {
        throw new Error(`Test image not found at ${jpgImageFilePath}. Convert to PNG requires a JPG; ensure nala/assets/test-image.jpg exists.`);
      }
      await frictionlessQAImage.uploadImage(jpgImageFilePath);
      await expect(frictionlessQAImage.convertToPngiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 4 : Convert to SVG
  test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
    const { data } = features[4];
    const testUrl = `${baseURL}${features[4].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (convert to SVG) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify convert to SVG block content/specs', async () => {
      await expect(frictionlessQAImage.type.convert_to_svg).toBeVisible();
      await expect(frictionlessQAImage.convertToSvgHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.convertToSvgContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.convertToSvgDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.convertToSvgTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.convert_to_svg });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect(frictionlessQAImage.convertToSvgiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 5 : Crop image
  test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
    const { data } = features[5];
    const testUrl = `${baseURL}${features[5].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (crop image) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify crop image block content/specs', async () => {
      await expect(frictionlessQAImage.type.crop_image).toBeVisible();
      await expect(frictionlessQAImage.cropImageHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.cropImageContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.cropImageDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.cropImageTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.crop_image });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect(frictionlessQAImage.cropImageiFrame).toBeVisible({ timeout: 30000 });
    });
  });

  // Test 6 : Change background
  test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
    const { data } = features[6];
    const testUrl = `${baseURL}${features[6].path}${miloLibs}`;

    await test.step('Go to frictionless-qa-image (change background) block test page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Verify change background block content/specs', async () => {
      await expect(frictionlessQAImage.type.change_background).toBeVisible();
      await expect(frictionlessQAImage.changeBackgroundHeading).toContainText(data.h1Text);
      await expect(frictionlessQAImage.changeBackgroundContent).toContainText(data.p1Text);
      await expect(frictionlessQAImage.changeBackgroundDropzoneText).toContainText(data.dropZoneText);
      await expect(frictionlessQAImage.changeBackgroundTermsAndPolicy).toContainText(data.p2Text);
      await expect(frictionlessQAImage.uploadPhotoButton).toBeVisible();
    });

    await test.step('Verify accessibility', async () => {
      await runAccessibilityTest({ page, testScope: frictionlessQAImage.type.change_background });
    });

    await test.step('Verify analytics attributes', async () => {
      await expect(frictionlessQAImage.section).toHaveAttribute('daa-lh', await webUtil.getSectionDaalh(1));
      await expect(frictionlessQAImage.frictionlessQAImage).toHaveAttribute('daa-lh', await webUtil.getBlockDaalh('frictionless-quick-action', 1));
    });

    await test.step('Upload a sample image file', async () => {
      await frictionlessQAImage.uploadImage(pngImageFilePath);
      await expect(frictionlessQAImage.changeBackgroundiFrame).toBeVisible({ timeout: 30000 });
    });
  });
});
