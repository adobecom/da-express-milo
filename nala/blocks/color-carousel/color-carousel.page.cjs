class ColorCarouselBlock {
  constructor(page, selector = '.color-carousel', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    this.header = this.block.locator('.color-carousel-header');
    this.chip = this.block.locator('.color-carousel-chip');
    this.chipLink = this.block.locator('a.color-carousel-chip');
    this.chipName = this.block.locator('.color-carousel-chip-name');
    this.chipHex = this.block.locator('.color-carousel-chip-hex');
    this.chipSwatch = this.block.locator('.color-carousel-chip-swatch');

    // Carousel arrows only mount when the row overflows its container.
    this.leftArrowBtn = this.block.locator('.button.carousel-arrow.carousel-arrow-left');
    this.rightArrowBtn = this.block.locator('.button.carousel-arrow.carousel-arrow-right');
  }
}
module.exports = ColorCarouselBlock;
