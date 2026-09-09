class AxMarqueeBlock {
  constructor(page, selector = '.ax-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = AxMarqueeBlock;
