class CollapsibleRowsBlock {
  constructor(page, selector = '.collapsible-rows', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = CollapsibleRowsBlock;
