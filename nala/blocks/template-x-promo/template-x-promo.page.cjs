export default class TemplateXPromo {
  constructor(page) {
    this.page = page;

    // Main block selectors
    this.templateXPromo = page.locator('.template-x-promo');
    this.carouselWrapper = page.locator('.promo-carousel-wrapper');
    this.carouselViewport = page.locator('.promo-carousel-viewport');
    this.carouselTrack = page.locator('.promo-carousel-track');

    // Templates
    this.templates = page.locator('.template');
    this.templateImages = page.locator('.template img');
    this.templateTitles = page.locator('.template .template-title');

    // Navigation
    this.prevButton = page.locator('.promo-prev-btn');
    this.nextButton = page.locator('.promo-next-btn');
    this.navControls = page.locator('.promo-nav-controls');

    // Hover overlays
    this.buttonContainers = page.locator('.button-container');
    this.editButtons = page.locator('.button-container a.button');
    this.shareButtons = page.locator('.share-icon-wrapper');

    // A11y elements
    this.carouselStatus = page.locator('#carousel-status');

    // Global elements
    this.globalFooter = page.locator('.global-footer');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.globalFooter.waitFor();
  }

  async waitForTemplates() {
    await this.templates.first().waitFor();
    await this.templateImages.first().waitFor();
  }

  async getTemplateCount() {
    return this.templates.count();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickPrev() {
    await this.prevButton.click();
  }

  async hoverTemplate(index = 0) {
    await this.templates.nth(index).hover();
  }

  async isCarouselVisible() {
    return this.carouselWrapper.isVisible();
  }

  async areNavigationButtonsVisible() {
    return this.navControls.isVisible();
  }
}
