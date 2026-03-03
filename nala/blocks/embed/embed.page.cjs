class EmbedBlock {
  constructor(page, selector = '..embed', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = EmbedBlock;
