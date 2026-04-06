import { expect, test } from '@playwright/test';
import { runAccessibilityTest } from '../../libs/accessibility.cjs';
import { features } from './frictionless-qa-easy-upload.spec.cjs';
import FrictionlessQAEasyUpload from './frictionless-qa-easy-upload.page.cjs';

const miloLibs = process.env.MILO_LIBS || '';

test.describe('Express Frictionless QA Easy Upload block test suite', () => {
  test.describe.configure({ retries: 1 });

  let easyUploadBlock;

  test.beforeEach(async ({ page }) => {
    easyUploadBlock = new FrictionlessQAEasyUpload(page);
  });

  test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
    const { data, path: pagePath } = features[0];
    const testUrl = `${baseURL}${pagePath}${miloLibs}`;

    await test.step('Navigate to easy upload variant page', async () => {
      await page.goto(testUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(testUrl);
    });

    await test.step('Validate initial dropzone pane content', async () => {
      await expect(easyUploadBlock.initialPane).toBeVisible();
      await expect(easyUploadBlock.initialHeading).toContainText(data.heading);
      await expect(easyUploadBlock.initialDescription).toContainText(data.description);
      await expect(easyUploadBlock.initialDropPrompt).toHaveText(data.dropPrompt);
      await expect(easyUploadBlock.initialOrDivider).toHaveText('OR');
      await expect(easyUploadBlock.initialCtas).toHaveCount(data.ctas.length);
      for (let i = 0; i < data.ctas.length; i += 1) {
        await expect(easyUploadBlock.initialCtas.nth(i)).toContainText(data.ctas[i]);
      }
      await expect(easyUploadBlock.initialInfoText).toContainText(data.infoText);
      await expect(easyUploadBlock.initialFreePlanTags).toHaveCount(2);
      await expect(easyUploadBlock.initialTermsParagraph).toContainText('By uploading your image or video, you agree to the Adobe');
    });

    await test.step('Run accessibility scan on the initial pane', async () => {
      await runAccessibilityTest({ page, testScope: easyUploadBlock.initialPane });
    });

    await test.step('Open the QR pane', async () => {
      await easyUploadBlock.uploadFromPhoneButton.click();
      await expect(easyUploadBlock.qrContainer).toBeVisible();
    });

    await test.step('Validate QR pane content', async () => {
      await expect(easyUploadBlock.qrHiddenDropzone).toHaveClass(/hidden/);
      await expect(easyUploadBlock.qrContainer).toBeVisible();
      await expect(easyUploadBlock.qrHeading).toHaveText(data.qrHeading);
      await expect(easyUploadBlock.qrSteps).toHaveCount(data.qrSteps.length);

      const stepTexts = await easyUploadBlock.qrSteps.allTextContents();
      stepTexts.forEach((text, index) => {
        expect(text.replace(/\s+/g, ' ').trim()).toBe(data.qrSteps[index]);
      });

      await expect(easyUploadBlock.confirmButton).toContainText(data.confirmLabel);
      await expect(easyUploadBlock.confirmButton).toHaveAttribute('aria-disabled', 'true');
      await expect(easyUploadBlock.confirmButton).toHaveClass(/disabled/);
      await expect(easyUploadBlock.confirmTooltip).toContainText(data.confirmTooltip);
      await expect(easyUploadBlock.qrCodeWidget).toBeVisible({ timeout: 10000 });
      await expect(easyUploadBlock.qrCodeWidget).toHaveAttribute('aria-label', 'QR code — scan with your phone to upload a file');
    });

    await test.step('Run accessibility scan on the QR pane', async () => {
      await runAccessibilityTest({ page, testScope: easyUploadBlock.qrPane });
    });
  });
});
