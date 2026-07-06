class FontGeneratorBlock {
  constructor(page, selector = '.font-generator', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Layout
    this.grid = this.block.locator('.font-generator-grid');
    this.sideCol = this.block.locator('.font-generator-col--side');
    this.mainCol = this.block.locator('.font-generator-col--main');

    // Side panel (preview input + suggestions)
    this.sidePanel = this.sideCol.locator('.side-panel');
    this.textarea = this.sidePanel.locator('textarea.label');
    this.suggestions = this.sidePanel.locator('.suggestion-list');

    // Filter panel
    this.filterPanel = this.sideCol.locator('.filter-panel');
    this.filterPanelClose = this.filterPanel.locator('.filter-panel-close');
    this.accordionItem = this.filterPanel.locator('sp-accordion-item').first();
    this.categoryButtons = this.filterPanel.locator('.category-btn');

    // Toolbar
    this.toolbar = this.mainCol.locator('.toolbar');
    this.filterTrigger = this.toolbar.locator('.filter-trigger');
    this.layoutToggle = this.toolbar.locator('.layout-toggle');
    this.fontSizeSlider = this.toolbar.locator('.font-size-slider');

    // Font card grid
    this.fontCardGrid = this.mainCol.locator('.font-card-grid');
    this.fontCards = this.fontCardGrid.locator('.font-card');
    this.loadMoreBtn = this.mainCol.locator('.font-card-load-more');
  }
}

module.exports = FontGeneratorBlock;
