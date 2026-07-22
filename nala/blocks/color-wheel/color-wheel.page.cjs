class ColorWheelBlock {
  constructor(page, selector = '.color-wheel', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = ColorWheelBlock;
