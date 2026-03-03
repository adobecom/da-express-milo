class PricingCardsCreditsBlock {
  constructor(page, selector = '.pricing-cards-credits', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = PricingCardsCreditsBlock;
