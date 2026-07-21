class DiscoveryTableBlock {
  constructor(page, selector = '.discovery-table', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }

  get sectionHeader() {
    return this.block.locator('.dt-section-header');
  }

  get headerText() {
    return this.block.locator('.dt-header-text');
  }

  get carouselNav() {
    return this.block.locator('.dt-carousel-nav');
  }

  get prevBtn() {
    return this.block.locator('.dt-nav-btn.dt-prev');
  }

  get nextBtn() {
    return this.block.locator('.dt-nav-btn.dt-next');
  }

  get table() {
    return this.block.locator('.dt-table');
  }

  get tableContainer() {
    return this.block.locator('.dt-table-container');
  }

  get dataColHeaders() {
    return this.block.locator('thead .dt-data-col');
  }

  get labelColCells() {
    return this.block.locator('tbody .dt-label-col');
  }

  get dataBodyCells() {
    return this.block.locator('tbody .dt-data-col');
  }
}

module.exports = DiscoveryTableBlock;
