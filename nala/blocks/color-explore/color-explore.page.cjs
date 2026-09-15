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

  // WebKit is consistently slower than Chromium/Firefox to finish decorating
  // these color-shared blocks in CI (observed up to ~20s vs ~2-10s), so this
  // needs real headroom above the 15s expect-timeout default.
  async waitReady() {
    await this.blockReady.waitFor({ state: 'attached', timeout: 30000 });
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
  // The click reliably flips the picker to aria-expanded, but SWC's
  // force-popover overlay intermittently fails to paint its menu in headless
  // WebKit -- the button ends up [expanded] with no listbox and the items stay
  // hidden. Waiting longer never recovers that load, so re-toggle instead:
  // Escape closes the stuck-open picker (aria-expanded back to false) and the
  // next click opens a fresh overlay that paints.
  async openPicker(nth = 0) {
    const picker = this.picker(nth);
    await picker.waitFor({ state: 'visible', timeout: 30000 });
    const firstItem = this.menuItems(nth).first();

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      await picker.click();
      try {
        // eslint-disable-next-line no-await-in-loop
        await firstItem.waitFor({ state: 'visible', timeout: 3000 });
        return picker;
      } catch (overlayNotPainted) {
        // eslint-disable-next-line no-await-in-loop
        await this.page.keyboard.press('Escape').catch(() => {});
        // eslint-disable-next-line no-await-in-loop
        await this.page.waitForTimeout(250); // let the overlay tear down before reopening
      }
    }

    // Surface the real error if the overlay never painted.
    await firstItem.waitFor({ state: 'visible', timeout: 5000 });
    return picker;
  }
}
module.exports = ColorExploreBlock;
