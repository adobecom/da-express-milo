module.exports = class TemplateXCarouselBlock {
  constructor(page, selector = '.template-x-carousel', nth = 0) {
    this.page = page;
    this.selector = selector;
    this.block = page.locator(selector).nth(nth);

    // Structure
    this.headersContainer = this.block.locator('.headers-container');
    this.heading = this.block.locator('.heading');
    this.description = this.block.locator('.description');
    this.toolbar = this.block.locator('.toolbar');

    // Templates / gallery
    this.templatesContainer = this.block.locator('.templates-container');
    this.templates = this.block.locator('.template');

    // Gallery carousel controls
    this.galleryControl = this.block.locator('.gallery-control');
    this.prevButton = this.galleryControl.locator('button.prev');
    this.nextButton = this.galleryControl.locator('button.next');

    // View All link
    this.viewAllLink = this.block.locator('a.view-all');
  }

  async goto(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForBlockReady() {
    await this.block.waitFor({ state: 'visible', timeout: 2000 });
  }

  async waitForTemplates() {
    await this.templates.first().waitFor({ state: 'visible', timeout: 2000 });
  }
};
