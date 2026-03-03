class LinkBladeBlock {
  constructor(page, selector = '.link-blade', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = LinkBladeBlock;
