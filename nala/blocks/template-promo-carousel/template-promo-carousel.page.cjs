module.exports = class TemplatePromoCarousel {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.template-promo-carousel').first();
    this.carousel = this.block.locator('.carousel-wrapper');
    this.templates = this.block.locator('.template');
    this.nextButton = this.block.locator('.carousel-next, .next-btn');
    this.prevButton = this.block.locator('.carousel-prev, .prev-btn');
    this.dots = this.block.locator('.carousel-dots .dot');
    this.autoplayIndicator = this.block.locator('.autoplay-indicator');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
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
    const box = await this.carousel.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
      await this.page.mouse.up();
    }
  }

  async swipeRight() {
    const box = await this.carousel.boundingBox();
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
