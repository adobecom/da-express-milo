class FontGeneratorBlock {
  constructor(page, selector = '.font-generator', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Layout
    this.grid = this.block.locator('.font-generator-grid');
    this.sideCol = this.block.locator('.font-generator-col--side');
    this.mainCol = this.block.locator('.font-generator-col--main');

    // Side panel (preview input + suggestions)
    this.sidePanel = this.sideCol.locator('.font-generator-side');
    this.textarea = this.sidePanel.locator('textarea.label');
    this.suggestionPills = this.sidePanel.locator('.tag-pills');

    // Desktop-inline filters — visible >=1200px, inside the sticky sidebar.
    this.desktopFilters = this.sideCol.locator('.fg-filters');

    // Mobile/tablet filter drawer — opened via the toolbar filter trigger.
    // Appended to the block (inside .fg-overlay), not the side column.
    this.filterOverlay = this.block.locator('.fg-overlay');
    this.filterPanel = this.block.locator('.fg-panel');
    this.filterPanelClose = this.filterPanel.locator('.fg-panel-close');
    this.filterTrayHandle = this.filterPanel.locator('.fg-tray-handle');

    // Category filter controls (present in both the desktop-inline and drawer
    // instances). Use :visible to target whichever instance is on-screen.
    this.filterButtons = this.block.locator('.fg-filter-btn');
    this.visibleFilterButtons = this.block.locator('.fg-filter-btn:visible');
    this.accordionItem = this.block.locator('sp-accordion-item').first();

    // Toolbar
    this.toolbar = this.mainCol.locator('.font-generator-toolbar');
    this.filterTrigger = this.toolbar.locator('.font-generator-filter-trigger');
    this.count = this.toolbar.locator('.toolbar-count');
    this.layoutGroup = this.toolbar.locator('.toolbar-layout-group');
    this.layoutButtons = this.layoutGroup.locator('.toolbar-layout-btn');
    this.gridButton = this.layoutGroup.locator('.toolbar-layout-btn[data-layout="grid"]');
    this.listButton = this.layoutGroup.locator('.toolbar-layout-btn[data-layout="list"]');
    this.fontSizeSlider = this.toolbar.locator('.toolbar-slider');

    // Font card grid
    this.fontCardGrid = this.mainCol.locator('.font-card-grid');
    this.fontCards = this.fontCardGrid.locator('.font-card');
    this.loadMoreBtn = this.mainCol.locator('.font-card-load-more');
  }
}

module.exports = FontGeneratorBlock;
