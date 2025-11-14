class PricingCardsBlock {
  constructor(page, selector = '.pricing-cards', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = PricingCardsBlock;
