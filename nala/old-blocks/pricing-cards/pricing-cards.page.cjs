export default class PricingCards {
  constructor(page) {
    this.page = page;
    // Align naming and structure with SimplifiedPricingCards page object
    this.pricingCards = page.locator('.pricing-cards');
    this.block = this.pricingCards; // backward compatibility for current tests
    this.card = this.pricingCards.locator('.card');
    this.cardHeader = this.card.locator('.card-header');
    this.header = this.cardHeader; // compatibility alias
    this.heading = this.cardHeader.locator('h2, h3');
    this.headerText = this.cardHeader.locator('p');
    this.planExplanation = this.card.locator('.card-explain');
    this.pricingArea = this.card.locator('.pricing-area');
    this.pricingRow = this.pricingArea.locator('.pricing-row');
    this.pricingBasePrice = this.pricingArea.locator('.pricing-base-price');
    this.pricingPrice = this.pricingArea.locator('.pricing-price');
    this.pricingRowSuf = this.pricingArea.locator('.pricing-row-suf');
    this.sectionMonthly = this.card.locator('.pricing-section.monthly');
    this.sectionAnnually = this.card.locator('.pricing-section.annually');
    this.billingToggle = this.card.locator('.billing-toggle[role="radiogroup"]');
    this.toggleButtons = this.billingToggle.locator('button[role="radio"]');
    this.button = this.card.locator('.button');
    this.ctas = this.card.locator('.card-cta-group a');
    this.compareLink = this.card.locator('.card-compare a');
    this.priceStrong = this.card.locator('.pricing-price > strong');
    this.globalFooter = page.locator('.global-footer');
  }

  async goto(url) {
    await this.gotoURL(url);
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.globalFooter.waitFor();
  }

  async scrollToPricingCards() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.pricingCards.scrollIntoViewIfNeeded(2000);
  }
}
