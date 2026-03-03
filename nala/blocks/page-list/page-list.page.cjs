class PageListBlock {
  constructor(page, selector = '.page-list', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = PageListBlock;
