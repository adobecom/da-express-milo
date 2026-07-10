class FontGeneratorBlock {
  constructor(page, selector = '.font-generator', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Layout
    this.container = this.block.locator('.fg-container');
    this.sidebar = this.block.locator('.fg-sidebar');
    this.main = this.block.locator('.fg-main');

    // Filters (sidebar — desktop only)
    this.sidebarFilters = this.sidebar.locator('.fg-filters');
    this.filterList = this.block.locator('.fg-filter-list').first();
    this.filterButtons = this.filterList.locator('.fg-filter-btn');
    this.allFilterBtn = this.filterList.locator('.fg-filter-btn[data-category=""]');
    this.categoryButtons = this.filterList.locator('.fg-filter-btn:not([data-category=""])');

    // Accordion
    this.accordionItem = this.block.locator('sp-accordion-item').first();
  }
}

module.exports = FontGeneratorBlock;
