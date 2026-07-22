class AxPanelsBlock {
  constructor(page, selector = '.ax-panels', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = AxPanelsBlock;
