class AxMarqueeDynamicHeroBlock {
  constructor(page, selector = '.ax-marquee-dynamic-hero', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = AxMarqueeDynamicHeroBlock;
