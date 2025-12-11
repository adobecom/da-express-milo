class FloatingPanelBlock {
  constructor(page, selector = '.floating-panel', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = FloatingPanelBlock;
