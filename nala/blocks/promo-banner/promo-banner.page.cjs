class PromoBannerBlock {
  constructor(page, selector = '.promo-banner', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.heading = this.block.locator('h2').first();
    this.button = this.block.locator('a.button').first();
  }
}
module.exports = PromoBannerBlock;
