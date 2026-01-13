export default class SimplifiedPricingCardsV2 {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.simplified-pricing-cards-v2');
    this.cardsWrapper = page.locator('.simplified-pricing-cards-v2 .card-wrapper');
    this.card = page.locator('.simplified-pricing-cards-v2 .card');
    this.cardInner = this.card.locator('.card-inner-content');
    this.cardHeader = this.card.locator('.card-header');
    this.headerToggleButton = this.cardHeader.locator('.header-toggle-button');
    this.planExplanation = this.card.locator('.plan-explanation');
    this.pricingArea = this.card.locator('.pricing-area');
    this.pricingRow = this.card.locator('.pricing-row');
    this.pricingBasePrice = this.card.locator('.pricing-base-price');
    this.pricingPrice = this.card.locator('.pricing-price');
    this.ctas = this.card.locator('.card-cta-group a');
    this.imageTooltips = this.card.locator('.image-tooltip button');
    this.tooltipText = this.card.locator('.tooltip-text');
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
