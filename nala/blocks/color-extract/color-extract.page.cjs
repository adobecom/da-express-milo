const path = require('path');

class ColorExtractBlock {
  constructor(page, selector = '.color-extract', nth = 0) {
    this.page = page;
    this.selector = selector;
    this.block = page.locator(selector).nth(nth);
    // Same block, but only once EDS has finished decorating it (JS wired up).
    this.blockReady = page.locator(`${selector}[data-block-status="loaded"]`).nth(nth);

    // Landing stage: dropzone + clickable sample images (before an image is chosen).
    this.landing = this.block.locator('.color-extract-landing');
    this.dropzone = this.block.locator('.image-upload-dropzone-container');
    // The dropzone's file input is a hidden <input type="file">; setInputFiles works on it.
    this.fileInput = this.block.locator('.image-upload-dropzone-container input[type="file"]');
    this.samples = this.block.locator('.color-extract-suggestion');

    // Edit stage: appears after an image is uploaded or a sample is picked.
    this.editStage = this.block.locator('.color-extract-edit');
    this.markers = this.block.locator('.color-extract-marker'); // sampled color points overlaid on the image

    // Removed in refactor (moved to color-headline) — asserted absent.
    this.hero = this.block.locator('.color-extract-hero');
  }

  // Deterministic input: a local fixture, so the extracted colors are stable per run.
  static get imagePath() {
    return path.resolve(__dirname, '../../assets/test-image.jpg');
  }

  // Gate interactions on the block being fully decorated — otherwise the upload
  // change-handler may not be wired yet and the file is silently dropped.
  // WebKit is consistently slower than Chromium/Firefox to finish decorating
  // these color-shared blocks in CI (observed up to ~20s vs ~2-10s), so this
  // needs real headroom above the 15s expect-timeout default.
  async waitReady() {
    await this.blockReady.waitFor({ state: 'attached', timeout: 30000 });
  }

  async uploadImage() {
    await this.waitReady();
    await this.fileInput.setInputFiles(ColorExtractBlock.imagePath);
  }

  async pickSample(nth = 0) {
    await this.waitReady();
    await this.samples.nth(nth).click();
  }
}

module.exports = ColorExtractBlock;
