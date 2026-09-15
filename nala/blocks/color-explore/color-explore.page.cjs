// WebKit is consistently slower than Chromium/Firefox to finish decorating
// these color-shared blocks in CI (observed up to ~20s vs ~2-10s), so every
// wait that depends on that decoration needs real headroom above Playwright's
// 15s expect-timeout default. Keep these waits driven by one constant so the
// block-ready wait and the picker-overlay wait can't drift apart.
const DECORATION_TIMEOUT = 30000;

class ColorExploreBlock {
  constructor(page, selector = '.color-explore', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    // Same block, but only once EDS has finished decorating it (JS wired up).
    this.blockReady = page.locator(`${selector}[data-block-status="loaded"]`).nth(nth);

    // Desktop filter controls (visible at >= 600px). Each dropdown wraps a
    // Spectrum <sp-picker> whose <sp-menu-item>s are hidden until it is opened.
    this.desktopFilters = this.block.locator('.filters-desktop');
    this.filterDropdowns = this.desktopFilters.locator('.filter-dropdown');
  }

  async waitReady() {
    await this.blockReady.waitFor({ state: 'attached', timeout: DECORATION_TIMEOUT });
  }

  // The <sp-picker> trigger for the dropdown at the given index.
  picker(nth = 0) {
    return this.filterDropdowns.nth(nth).locator('sp-picker');
  }

  // The <sp-menu-item>s belonging to the dropdown at the given index.
  menuItems(nth = 0) {
    return this.filterDropdowns.nth(nth).locator('sp-menu-item');
  }

  // Open a desktop picker and wait for its overlay to render its items. The
  // click can be dropped if the sp-picker has not hydrated yet, so wait for it
  // to be visible first, then give the overlay the same WebKit-sized headroom
  // as the block-ready wait (the menu items are decorated by the same slow SWC
  // pipeline).
  async openPicker(nth = 0) {
    const picker = this.picker(nth);
    await picker.waitFor({ state: 'visible', timeout: DECORATION_TIMEOUT });
    await picker.click();
    await this.menuItems(nth).first().waitFor({ state: 'visible', timeout: DECORATION_TIMEOUT });
    return picker;
  }
}
module.exports = ColorExploreBlock;
