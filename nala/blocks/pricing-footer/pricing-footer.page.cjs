export default class PricingFooter {
  constructor(page) {
    this.page = page;
    this.section = this.page
      .locator('.section:not([hidden])')
      .filter({ has: this.page.locator('.pricing-footer') })
      .first();
    this.block = this.section.locator('.pricing-footer').first();
    this.columns = this.block.locator(':scope > div');
    this.cardsContainer = this.block.locator('xpath=preceding-sibling::*[contains(@class,"content")][1]');
    this.merchCards = this.cardsContainer.locator('merch-card');
    this.globalFooter = this.page.locator('.global-footer');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
    await this.globalFooter.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async scrollToBlock() {
    await this.page.waitForTimeout(5000);
    await this.block.scrollIntoViewIfNeeded();
  }

  async countEmptyColumns() {
    return this.columns.evaluateAll((nodes) => nodes.filter((node) => !node.textContent.trim()).length);
  }

  async getCardCount() {
    return this.block.evaluate((node) => {
      const cardClass = Array.from(node.classList).find((cls) => cls.startsWith('card-count-'));
      if (!cardClass) return 0;
      const [, , count] = cardClass.split('-');
      return Number.parseInt(count, 10);
    });
  }

  async getMerchCardCount() {
    const containerCount = await this.cardsContainer.count();
    if (containerCount === 0) return 0;
    return this.merchCards.count();
  }

  async getComputedMaxWidth() {
    return this.block.evaluate((node) => window.getComputedStyle(node).maxWidth);
  }
}
