class PaletteColumnsBlock {
  constructor(page, selector = '.palette-columns', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    // Added once async decoration (rail + CTAs) has finished.
    this.blockReady = page.locator(`${selector}.is-ready`).nth(nth);

    this.content = this.block.locator('.palette-columns-content');
    this.swatches = this.block.locator('.palette-columns-swatches');
    this.rail = this.block.locator('color-swatch-rail');
    // Playwright CSS locators pierce the rail's open shadow root.
    this.hexCodes = this.rail.locator('.hex-code');
    this.copyButtons = this.rail.locator('.icon-button--copy');
    this.ctas = this.block.locator('.palette-columns-ctas');
    this.editCta = this.block.locator('a.palette-columns-edit');
    this.generateCta = this.block.locator('button.palette-columns-generate');
  }

  async waitReady() {
    await this.blockReady.waitFor({ state: 'attached', timeout: 30000 });
  }

  async hexValues() {
    return (await this.hexCodes.allTextContents()).map((t) => t.trim().toUpperCase());
  }
}

module.exports = PaletteColumnsBlock;
