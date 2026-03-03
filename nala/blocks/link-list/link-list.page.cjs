class LinkListBlock {
  constructor(page, selector = '.link-list', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = LinkListBlock;
