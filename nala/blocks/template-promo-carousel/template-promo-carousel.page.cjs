module.exports = class TemplatePromoCarousel {
  constructor(page) {
    this.page = page;
    // Use template-x-promo selector since test pages use that block
    this.block = page.locator('.template-x-promo').first();
    // Carousel structure from template-x-promo
    this.carousel = this.block.locator('.promo-carousel-wrapper');
    this.carouselViewport = this.block.locator('.promo-carousel-viewport');
    this.carouselTrack = this.block.locator('.promo-carousel-track');
    this.templates = this.block.locator('.template');
    // Navigation buttons from template-x-promo
    this.nextButton = this.block.locator('.promo-next-btn');
    this.prevButton = this.block.locator('.promo-prev-btn');
    this.navControls = this.block.locator('.promo-nav-controls');
    this.dots = this.block.locator('.carousel-dots .dot');
    this.autoplayIndicator = this.block.locator('.autoplay-indicator');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for template-x-promo block to be decorated
    await this.page.waitForSelector('.template-x-promo[data-decorated="true"], .promo-carousel-wrapper', { timeout: 15000 }).catch(() => {});
  }

  async waitForTemplates() {
    // Wait for at least one template to appear (API-driven loading)
    await this.templates.first().waitFor({ timeout: 15000 }).catch(() => {});
    // Wait for templates to stabilize by checking for carousel structure
    await this.carouselTrack.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
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

  async clickDot(index) {
    await this.dots.nth(index).click();
  }

  async getActiveSlideIndex() {
    const activeSlide = this.carousel.locator('.active, .is-active').first();
    if (await activeSlide.isVisible()) {
      return this.carousel.locator('.slide, .carousel-item').count();
    }
    return 0;
  }

  async swipeLeft() {
    // Use carousel viewport or track for swipe
    const container = this.carouselViewport.first().isVisible().catch(() => false)
      ? this.carouselViewport.first()
      : this.carouselTrack.first();
    const box = await container.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  async swipeRight() {
    // Use carousel viewport or track for swipe
    const container = this.carouselViewport.first().isVisible().catch(() => false)
      ? this.carouselViewport.first()
      : this.carouselTrack.first();
    const box = await container.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  async isAutoplayActive() {
    return this.autoplayIndicator.isVisible();
  }
};
