class ColorExplorerBlock {
  constructor(page, selector = '.color-explorer.gradients', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }

  get container() {
    return this.block.locator('.color-explorer-container');
  }

  get gradientsSection() {
    return this.block.locator('.gradients-main-section');
  }

  get header() {
    return this.block.locator('.gradients-header');
  }

  get title() {
    return this.block.locator('.gradients-title');
  }

  get resultsCount() {
    return this.block.locator('.results-count');
  }

  get filtersContainer() {
    return this.block.locator('.filters-container');
  }

  get grid() {
    return this.block.locator('.gradients-grid');
  }

  get gradientCards() {
    return this.block.locator('.gradient-card');
  }

  get loadMoreButton() {
    return this.block.locator('.gradient-load-more-btn');
  }

  get loadMoreContainer() {
    return this.block.locator('.load-more-container');
  }

  get liveRegion() {
    return this.block.locator('.visually-hidden[aria-live="polite"]');
  }

  async getGradientCard(index) {
    return this.gradientCards.nth(index);
  }

  async getGradientCardName(index) {
    const card = await this.getGradientCard(index);
    return card.locator('.gradient-name');
  }

  async getGradientActionButton(index) {
    const card = await this.getGradientCard(index);
    return card.locator('.gradient-action-btn');
  }
}

module.exports = ColorExplorerBlock;
