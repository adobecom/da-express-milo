class HowToV2 {
  constructor(page, selector = '.how-to-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.mediaContainer = this.block.locator('.media-container');
    this.stepItems = this.block.locator('li.step');
    this.stepTitles = this.block.locator('.step-content > h3');
    this.stepIndicators = this.block.locator('.step-indicator');
    this.detailContainers = this.block.locator('.detail-container');
  }
}

module.exports = HowToV2;
