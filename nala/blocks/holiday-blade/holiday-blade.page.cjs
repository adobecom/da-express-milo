module.exports = class HolidayBlade {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.holiday-blade').first();
    this.holidayIcon = this.block.locator('.holiday-icon');
    this.title = this.block.locator('.holiday-title, h2, h3');
    this.templates = this.block.locator('.template');
    this.expandButton = this.block.locator('.expand-button, .toggle-button');
    this.collapseButton = this.block.locator('.collapse-button');
    this.templateGrid = this.block.locator('.template-grid, .templates-container');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTemplateCount() {
    return this.templates.count();
  }

  async expandBlade() {
    if (await this.expandButton.isVisible()) {
      await this.expandButton.click();
    }
  }

  async collapseBlade() {
    if (await this.collapseButton.isVisible()) {
      await this.collapseButton.click();
    }
  }

  async isExpanded() {
    return this.block.evaluate((el) => el.classList.contains('expanded') || el.classList.contains('open'));
  }

  async getHolidayIcon() {
    if (await this.holidayIcon.isVisible()) {
      return this.holidayIcon.getAttribute('src');
    }
    return null;
  }

  async getTitleText() {
    return this.title.textContent();
  }

  async clickTemplate(index) {
    await this.templates.nth(index).click();
  }

  async hoverTemplate(index) {
    await this.templates.nth(index).hover();
  }
};
