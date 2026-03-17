export default class FrictionlessQAEasyUpload {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.frictionless-quick-action[data-frictionlesstype="remove-background-easy-upload-variant"]').first();

    this.initialPane = this.block;
    this.qrPane = this.block;

    this.initialHeading = this.block.locator('h1');
    this.initialDescription = this.block.locator('h1 + p');
    this.initialDropzone = this.block.locator('.dropzone').first();
    this.initialDropPrompt = this.initialDropzone.locator('p').first();
    this.initialOrDivider = this.initialDropzone.locator('.easy-upload-or span');
    this.initialCtas = this.initialDropzone.locator('.easy-upload-cta-row a.button');
    this.initialInfoText = this.initialDropzone.locator('p').filter({ hasText: 'File must be' }).first();
    this.initialFreePlanTags = this.initialDropzone.locator('.free-plan-widget .plan-widget-tag');
    this.initialTermsParagraph = this.block.locator('.fqa-container > div:nth-child(2) > p').last();

    this.uploadFromPhoneButton = this.initialCtas.nth(1);
    this.qrHiddenDropzone = this.block.locator('.dropzone-container').first();
    this.qrContainer = this.block.locator('.qr-code-container.dropzone-container');
    this.qrHeading = this.qrContainer.locator('.easy-upload-heading');
    this.qrSteps = this.qrContainer.locator('.easy-upload-step');
    this.confirmButton = this.qrContainer.locator('.confirm-import-button');
    this.confirmTooltip = this.qrContainer.locator('.easy-upload-confirm .tooltip-text');
    this.qrErrorMessage = this.qrContainer.locator('.qr-error-message');
    this.qrSecurityTooltip = this.qrContainer.locator('.tooltip.security .tooltip-text');
    this.qrErrorToast = this.block.locator('.error-toast');
  }
}
