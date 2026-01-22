class FrictionlessQuickActionBlock {
  constructor(page, selector = '.frictionless-quick-action', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = FrictionlessQuickActionBlock;
