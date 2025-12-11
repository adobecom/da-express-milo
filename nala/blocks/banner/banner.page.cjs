class BannerBlock {
  constructor(page, selector = '.banner', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = BannerBlock;
