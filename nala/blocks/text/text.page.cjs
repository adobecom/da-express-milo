class TextBlock {
  constructor(page, selector = '.text', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = TextBlock;
