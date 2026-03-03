class LinkListV2Block {
  constructor(page, selector = '.link-list-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = LinkListV2Block;
