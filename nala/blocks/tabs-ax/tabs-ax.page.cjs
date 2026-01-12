module.exports = class TabsAx {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.tabs-ax, .tabs').first();
    this.tablist = this.block.locator('[role="tablist"]');
    this.tabs = this.block.locator('[role="tab"]');
    this.tabpanels = this.block.locator('[role="tabpanel"]');
    this.activeTab = this.block.locator('[role="tab"][aria-selected="true"]');
    this.activePanel = this.block.locator('[role="tabpanel"]:not([hidden])');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTabCount() {
    return this.tabs.count();
  }

  async getPanelCount() {
    return this.tabpanels.count();
  }

  async clickTab(index) {
    await this.tabs.nth(index).click();
  }

  async clickTabByText(text) {
    await this.tabs.filter({ hasText: text }).click();
  }

  async getActiveTabText() {
    return this.activeTab.textContent();
  }

  async getActivePanelText() {
    return this.activePanel.textContent();
  }

  async isTabActive(index) {
    const tab = this.tabs.nth(index);
    const ariaSelected = await tab.getAttribute('aria-selected');
    return ariaSelected === 'true';
  }

  async isPanelVisible(index) {
    const panel = this.tabpanels.nth(index);
    const hidden = await panel.getAttribute('hidden');
    return hidden === null;
  }

  async navigateWithArrowKeys(direction) {
    await this.activeTab.focus();
    if (direction === 'right') {
      await this.page.keyboard.press('ArrowRight');
    } else if (direction === 'left') {
      await this.page.keyboard.press('ArrowLeft');
    }
  }

  async tabToNextElement() {
    await this.page.keyboard.press('Tab');
  }

  async getTabAriaControls(index) {
    return this.tabs.nth(index).getAttribute('aria-controls');
  }

  async getTabId(index) {
    return this.tabs.nth(index).getAttribute('id');
  }
};
