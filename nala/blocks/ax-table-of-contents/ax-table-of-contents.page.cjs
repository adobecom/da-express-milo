class AxTableOfContentsBlock {
  constructor(page, selector = '.ax-table-of-contents', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = AxTableOfContentsBlock;
