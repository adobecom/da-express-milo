class HowToV3Block {
  constructor(page, selector = '.how-to-v3', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HowToV3Block;
