class FloatingButtonsBlock {
  constructor(page, selector = '.floating-buttons', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = FloatingButtonsBlock;
