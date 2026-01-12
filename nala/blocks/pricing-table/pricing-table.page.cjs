class PricingTableBlock {
  constructor(page, selector = '.pricing-table', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = PricingTableBlock;
