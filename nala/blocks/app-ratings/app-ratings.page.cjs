class AppRatingsBlock {
  constructor(page, selector = '.app-ratings', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = AppRatingsBlock;
