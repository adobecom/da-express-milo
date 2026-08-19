class ColorContrastCheckerBlock {
  constructor(page, selector = '.color-contrast-checker', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    // Same block, but only once EDS has finished decorating it (JS wired up).
    this.blockReady = page.locator(`${selector}[data-block-status="loaded"]`).nth(nth);
  }

  // WebKit is consistently slower than Chromium/Firefox to finish decorating
  // these color-shared blocks in CI (observed up to ~20s vs ~2-10s), so this
  // needs real headroom above the 15s expect-timeout default.
  async waitReady() {
    await this.blockReady.waitFor({ state: 'attached', timeout: 30000 });
  }
}
module.exports = ColorContrastCheckerBlock;
