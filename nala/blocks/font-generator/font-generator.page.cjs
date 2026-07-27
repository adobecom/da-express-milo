class FontGeneratorBlock {
  constructor(page, selector = '.font-generator', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Layout
    this.grid = this.block.locator('.fg-container');
    this.sideCol = this.block.locator('.fg-sidebar');
    this.mainCol = this.block.locator('.fg-main');

    // Text input (preview input + suggestions)
    this.textInput = this.sideCol.locator('.font-generator-text-input');
    this.textarea = this.textInput.locator('textarea.label');
    this.suggestionsToolbar = this.textInput.locator('.tags-wrap');
    this.suggestionPills = this.textInput.locator('.tag-pills');

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

    // Per-card interactive children — out of the normal tab order until
    // their card is "entered" (see cardCopyBtn(n)/cardCta(n) below).
    this.cardCopyBtn = this.fontCards.first().locator('.font-card-copy-btn');
    this.cardCta = this.fontCards.first().locator('.font-card-cta');
  }

  // nth card's copy button / CTA link — used to verify Enter-to-enter and
  // Tab-cycle behavior on a specific cell rather than always the first.
  cardCopyBtnAt(nth) {
    return this.fontCards.nth(nth).locator('.font-card-copy-btn');
  }

  cardCtaAt(nth) {
    return this.fontCards.nth(nth).locator('.font-card-cta');
  }

  // Target a category filter by its stable data-category value. The visible
  // button label is Unicode-transformed (e.g. Glitch renders as
  // "G̶̶l̶̶i̶̶t̶̶c̶̶h̶̶"), so matching on visible text does not work — the raw
  // category lives on data-category. :visible picks whichever of the two
  // instances (desktop-inline vs. drawer) is currently on-screen.
  categoryFilter(category) {
    return this.block.locator(`.fg-filter-btn[data-category="${category}"]:visible`);
  }
}

module.exports = FontGeneratorBlock;
