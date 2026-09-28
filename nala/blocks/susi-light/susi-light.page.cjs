class SusiLightBlock {
  constructor(page, selector = '.susi-light', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.layout = this.block.locator('.susi-layout');
    this.tabPanels = this.block.locator('.susi-tab-panels');
    this.tabs = this.block.locator('[role="tab"]');
    this.susiComponent = this.block.locator('susi-sentry-light');
  }

  async waitForSusiReady(timeout = 30000) {
    await this.susiComponent.first().waitFor({ state: 'visible', timeout });
  }

  async waitForActiveSusiReady(timeout = 30000) {
    await this.block.locator('[role="tabpanel"]:not(.hide) susi-sentry-light')
      .waitFor({ state: 'visible', timeout });
  }

  async getLayoutHeight() {
    const box = await this.layout.boundingBox();
    return box?.height ?? 0;
  }

  async getTabPanelsHeight() {
    const box = await this.tabPanels.boundingBox();
    return box?.height ?? 0;
  }

  async getTabsPanelReservePx() {
    const value = await this.block.evaluate((el) => el.style.getPropertyValue('--susi-tabs-panel-height').trim());
    return parseInt(value, 10) || 0;
  }

  async getTabPanelsMinHeightPx() {
    return this.tabPanels.evaluate((el) => parseFloat(getComputedStyle(el).minHeight) || 0);
  }

  async clickTab(index) {
    await this.tabs.nth(index).click();
    await this.susiComponent.nth(index).waitFor({ state: 'attached', timeout: 30000 });
  }
}

module.exports = SusiLightBlock;
