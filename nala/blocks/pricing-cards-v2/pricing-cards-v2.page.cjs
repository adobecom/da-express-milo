export default class PricingCardsV2 {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.pricing-cards-v2');
    this.card = this.block.locator('.card');
    this.cardHeader = this.card.locator('.card-header');
    this.planExplanation = this.card.locator('.plan-explanation');
    this.pricingSectionMonthly = this.card.locator('.pricing-section.monthly');
    this.pricingArea = this.card.locator('.pricing-area');
    this.pricingRow = this.card.locator('.pricing-row');
    this.pricingBasePrice = this.card.locator('.pricing-base-price');
    this.pricingPrice = this.card.locator('.pricing-price');
    this.ctas = this.card.locator('.card-cta-group a');
    this.compareLink = this.card.locator('.card-compare a');
    this.globalFooter = page.locator('.global-footer');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.globalFooter.waitFor();
  }

  async scrollToBlock() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.block.scrollIntoViewIfNeeded(2000);
  }
}
