class TemplateXCarouselToolbarBlock {
  constructor(page, selector = '.template-x-carousel-toolbar', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = TemplateXCarouselToolbarBlock;
