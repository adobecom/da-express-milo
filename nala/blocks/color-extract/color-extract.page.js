export default class ColorExtractPage {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.color-extract');
    this.landing = this.block.locator('.color-extract-landing');
    this.suggestions = this.block.locator('.color-extract-suggestion');
    this.editStage = this.block.locator('.color-extract-edit');
    this.dropzone = this.block.locator('.image-upload-dropzone-container');
    this.hero = this.block.locator('.color-extract-hero');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async scrollIntoView() {
    if (await this.block.count()) {
      await this.block.scrollIntoViewIfNeeded();
    }
  }
}
