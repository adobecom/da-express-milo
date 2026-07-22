class HeadlineBlock {
  constructor(page, selector = '.headline', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HeadlineBlock;
