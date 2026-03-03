class BrowseByCategoryBlock {
  constructor(page, selector = '.browse-by-category', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = BrowseByCategoryBlock;
