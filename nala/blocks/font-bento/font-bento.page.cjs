class FontBentoBlock {
  constructor(page, selector = '.font-bento', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.header = this.block.locator('.font-bento-header');
    this.grid = this.block.locator('.font-bento-grid');
  }

  card(n) {
    return this.block.locator('.font-bento-card').nth(n - 1);
  }
}

module.exports = FontBentoBlock;
