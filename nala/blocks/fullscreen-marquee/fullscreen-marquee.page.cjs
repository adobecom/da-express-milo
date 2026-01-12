class FullscreenMarqueeBlock {
  constructor(page, selector = '.fullscreen-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = FullscreenMarqueeBlock;
