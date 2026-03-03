class StepsBlock {
  constructor(page, selector = '.steps', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = StepsBlock;
