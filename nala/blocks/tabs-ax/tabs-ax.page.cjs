class TabsAxBlock {
  constructor(page, selector = '.tabs-ax', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = TabsAxBlock;
