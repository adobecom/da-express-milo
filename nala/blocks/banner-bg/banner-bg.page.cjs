class BannerBgBlock {
  constructor(page, selector = '.banner-bg', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = BannerBgBlock;
