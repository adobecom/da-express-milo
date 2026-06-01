class SusiLightBlock {
  constructor(page, selector = '.susi-light', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.layout = this.block.locator('.susi-layout');
    this.tabs = this.block.locator('[role="tab"]');
    this.susiComponent = this.block.locator('susi-sentry-light');
  }

  async waitForSusiReady(timeout = 30000) {
    await this.susiComponent.first().waitFor({ state: 'visible', timeout });
  }

  async getLayoutHeight() {
    const box = await this.layout.boundingBox();
    return box?.height ?? 0;
  }

  async clickTab(index) {
    await this.tabs.nth(index).click();
    await this.susiComponent.nth(index).waitFor({ state: 'visible', timeout: 30000 });
  }
}

module.exports = SusiLightBlock;
