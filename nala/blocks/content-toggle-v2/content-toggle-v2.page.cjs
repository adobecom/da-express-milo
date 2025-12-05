class ContentToggleV2Block {
  constructor(page, selector = '.content-toggle-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = ContentToggleV2Block;
