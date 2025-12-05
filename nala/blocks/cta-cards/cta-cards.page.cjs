class CtaCardsBlock {
  constructor(page, selector = '.cta-cards', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = CtaCardsBlock;
