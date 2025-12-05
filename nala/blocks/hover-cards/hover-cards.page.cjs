class HoverCardsBlock {
  constructor(page, selector = '.hover-cards', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HoverCardsBlock;
