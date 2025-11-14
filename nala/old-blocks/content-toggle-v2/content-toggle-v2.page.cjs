export default class ContentToggleV2 {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    this.main = page.locator('main');
    this.section = page.locator('.section').nth(nth);
    // Block can be wrapped with content-toggle class via addTempWrapperDeprecated
    this.block = page.locator('.content-toggle-wrapper .content-toggle-v2').nth(nth);
    this.carouselContainer = this.block.locator('.content-toggle-carousel-container');
    this.tablist = this.carouselContainer; // role=tablist is on the container
    this.tabs = this.carouselContainer.locator('.content-toggle-button');
    this.activeTab = this.carouselContainer.locator('.content-toggle-button.active');

    // Toggle content sections identified by data-toggle
    this.sections = page.locator('.section[data-toggle]');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
