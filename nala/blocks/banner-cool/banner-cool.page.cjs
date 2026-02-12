class BannerCoolBlock {
  constructor(page, selector = '.banner-cool', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = BannerCoolBlock;
