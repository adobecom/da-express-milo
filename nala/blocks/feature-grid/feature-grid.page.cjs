class FeatureGridBlock {
  constructor(page, selector = '.feature-grid', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = FeatureGridBlock;
