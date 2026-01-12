module.exports = class TemplateXCarouselToolbar {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.template-x-carousel-toolbar').first();
    this.toolbar = this.block.locator('.toolbar, .carousel-toolbar');
    this.carousel = this.block.locator('.carousel-wrapper');
    this.templates = this.block.locator('.template');
    this.nextButton = this.block.locator('.carousel-next, .next-btn');
    this.prevButton = this.block.locator('.carousel-prev, .prev-btn');
    this.categoryButtons = this.toolbar.locator('.category-button, .filter-button');
    this.searchInput = this.toolbar.locator('input[type="search"]');
    this.toolbarTitle = this.toolbar.locator('h2, h3, .toolbar-title');
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

  async selectCategory(categoryName) {
    const category = this.categoryButtons.filter({ hasText: categoryName });
    await category.click();
  }

  async searchTemplates(query) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      await this.page.keyboard.press('Enter');
    }
  }

  async getCategoryCount() {
    return this.categoryButtons.count();
  }

  async getToolbarTitle() {
    return this.toolbarTitle.textContent();
  }

  async isToolbarSticky() {
    return this.toolbar.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.position === 'sticky' || style.position === 'fixed';
    });
  }
};
