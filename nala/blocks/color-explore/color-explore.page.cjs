class ColorExploreBlock {
  constructor(page, selector = '.color-explore', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Desktop filter controls (visible at >= 600px). Each dropdown wraps a
    // Spectrum <sp-picker> whose <sp-menu-item>s are hidden until it is opened.
    this.desktopFilters = this.block.locator('.filters-desktop');
    this.filterDropdowns = this.desktopFilters.locator('.filter-dropdown');
  }

  // The <sp-picker> trigger for the dropdown at the given index.
  picker(nth = 0) {
    return this.filterDropdowns.nth(nth).locator('sp-picker');
  }

  // The <sp-menu-item>s belonging to the dropdown at the given index.
  menuItems(nth = 0) {
    return this.filterDropdowns.nth(nth).locator('sp-menu-item');
  }

  // Open a desktop picker and wait for its overlay to render its items.
  async openPicker(nth = 0) {
    const picker = this.picker(nth);
    await picker.click();
    await this.menuItems(nth).first().waitFor({ state: 'visible', timeout: 8000 });
    return picker;
  }
}
module.exports = ColorExploreBlock;
