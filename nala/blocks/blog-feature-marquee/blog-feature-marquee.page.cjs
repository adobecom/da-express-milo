class BlogFeatureMarqueeBlock {
  constructor(page, selector = '.blog-feature-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}

module.exports = BlogFeatureMarqueeBlock;
