class CardsBlock {
  constructor(page, selector = '.cards', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = CardsBlock;
