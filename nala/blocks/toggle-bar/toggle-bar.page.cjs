class ToggleBarBlock {
  constructor(page, selector = '.toggle-bar', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = ToggleBarBlock;
