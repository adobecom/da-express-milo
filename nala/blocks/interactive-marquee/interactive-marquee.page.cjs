class InteractiveMarqueeBlock {
  constructor(page, selector = '.interactive-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = InteractiveMarqueeBlock;
