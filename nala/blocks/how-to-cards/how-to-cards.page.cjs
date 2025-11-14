class HowToCardsBlock {
  constructor(page, selector = '.how-to-cards', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HowToCardsBlock;
