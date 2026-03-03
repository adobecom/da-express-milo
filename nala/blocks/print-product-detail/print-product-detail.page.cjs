const { features } = require('./print-product-detail.spec.cjs');

class PrintProductDetail {
  constructor(page) {
    this.page = page;
    // Feature definitions (kept for compatibility)
    this.features = features;
  }

  /**
   * Navigate to URL and wait for page load
   */
  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = PrintProductDetail;
