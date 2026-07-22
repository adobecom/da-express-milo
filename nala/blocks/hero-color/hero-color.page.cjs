class HeroColorBlock {
  constructor(page, selector = '.hero-color', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HeroColorBlock;
