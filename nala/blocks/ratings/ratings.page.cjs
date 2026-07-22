class RatingsBlock {
  constructor(page, selector = '.ratings', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = RatingsBlock;
