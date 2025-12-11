class CtaCarouselBlock {
  constructor(page, selector = '.cta-carousel', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = CtaCarouselBlock;
