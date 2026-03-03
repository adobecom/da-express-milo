class CollapsibleCardBlock {
  constructor(page, selector = '.collapsible-card', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = CollapsibleCardBlock;
