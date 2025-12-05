class HowToStepsBlock {
  constructor(page, selector = '.how-to-steps', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = HowToStepsBlock;
