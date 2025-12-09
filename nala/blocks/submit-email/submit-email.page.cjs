class SubmitEmailBlock {
  constructor(page, selector = '.submit-email', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = SubmitEmailBlock;
