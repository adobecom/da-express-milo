class CardBlock {
  constructor(page, selector = '.card', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = CardBlock;
