class QuickActionHubBlock {
  constructor(page, selector = '.quick-action-hub', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = QuickActionHubBlock;
