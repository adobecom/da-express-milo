class FeatureListBlock {
  constructor(page, selector = '.feature-list', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = FeatureListBlock;
