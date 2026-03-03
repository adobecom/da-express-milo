class ComparisonTableV2Block {
  constructor(page, selector = '.comparison-table-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }

  get accordionContainers() {
    return this.block.locator('.table-container:not(.no-accordion)');
  }

  get noAccordionContainers() {
    return this.block.locator('.table-container.no-accordion');
  }

  tableAt(index) {
    return this.accordionContainers.nth(index).locator('table');
  }

  toggleAt(index) {
    return this.accordionContainers.nth(index).locator('.toggle-button');
  }
}

module.exports = ComparisonTableV2Block;
