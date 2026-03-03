class SeoNavBlock {
  constructor(page, selector = '.seo-nav', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = SeoNavBlock;
