class MobileForkButtonBlock {
  constructor(page, selector = 'main .floating-button-wrapper') {
    this.page = page;
    this.wrapper = page.locator(selector);
    this.block = this.wrapper.locator('.floating-button');
    this.rows = this.block.locator('.mobile-gating-row');
    this.links = this.block.getByRole('link');
    this.pageHeading = page.locator('main h1');
    this.eligibility = page.locator('meta[name="fork-eligibility-check"]');
  }

  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }
}

module.exports = MobileForkButtonBlock;
