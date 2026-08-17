class ColorSearchMarqueeBlock {
  constructor(page, selector = '.color-search-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    // Same block, but only once EDS has finished decorating it (JS wired up).
    this.blockReady = page.locator(`${selector}[data-block-status="loaded"]`).nth(nth);
  }

  async waitReady() {
    await this.blockReady.waitFor({ state: 'attached', timeout: 15000 });
  }
}
module.exports = ColorSearchMarqueeBlock;
