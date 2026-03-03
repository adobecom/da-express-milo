class MakeAProjectBlock {
  constructor(page, selector = '.make-a-project', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = MakeAProjectBlock;
