class ContentToggleBlock {
  constructor(page, selector = '.content-toggle', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = ContentToggleBlock;
