class ColorImgAccordionBlock {
  constructor(page, selector = '.color-img-accordion', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.heading = this.block.locator('.color-img-accordion-heading');
    this.image = this.block.locator('.color-img-accordion-photo picture img');
    this.palette = this.block.locator('.color-img-accordion-palette');
    this.swatches = this.block.locator('.color-img-accordion-swatch');
    this.buttons = this.block.locator('.color-img-accordion-button');
    this.panels = this.block.locator('.color-img-accordion-panel');
  }
}

module.exports = ColorImgAccordionBlock;
