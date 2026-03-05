class TocSeoBlock {
  constructor(page, selector = '.toc-container', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = TocSeoBlock;
