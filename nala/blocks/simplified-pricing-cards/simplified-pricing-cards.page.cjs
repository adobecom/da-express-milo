export default class SimplifiedPricingCards {
  constructor(page) {
    this.page = page;
    this.simplifiedPricingCards = page.locator('.simplified-pricing-cards');
    this.card = this.simplifiedPricingCards.locator('.card');
    this.cardHeader = this.card.locator('.card-header');
    this.heading = this.cardHeader.locator('h2');
    this.headerText = this.cardHeader.locator('p');
    this.planExplanation = this.card.locator('.plan-explanation');
    this.pricingArea = this.card.locator('.pricing-area');
    this.pricingRow = this.pricingArea.locator('.pricing-row');
    this.pricingBasePrice = this.pricingRow.locator('.pricing-base-price');
    this.pricingPrice = this.pricingRow.locator('.pricing-price');
    this.pricingRowSuf = this.pricingRow.locator('.pricing-row-suf');
    this.button = this.card.locator('.button');
    this.faasForm = page.locator('#sales-contact-form-1');
    this.freeButton = this.card.getByRole('link', { name: 'Get Adobe Express Free' });
    this.premiumButton = this.card.getByRole('link', { name: 'Start 30-day free trial' });
    this.teamsButton = this.card.getByRole('link', { name: 'Start 14-day free trial' });
    this.enterpriseButton = this.card.getByRole('link', { name: 'Request information' });
    this.pricingFooter = this.simplifiedPricingCards.locator('.pricing-footer');
    this.nonprofitsLink = page.getByRole('link', { name: 'Nonprofits' });
    this.k12EducatorsLink = page.getByRole('link', { name: 'K-12 Educators' });
    this.globalFooter = page.locator('.global-footer');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.globalFooter.waitFor({ timeout: 3000 });
  }

  async scrollToPricingCards() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.simplifiedPricingCards.scrollIntoViewIfNeeded({ timeout: 3000 });
  }

  async clickAndAwaitNavigation(button) {
    const currentUrl = this.page.url();
    await button.click();
    await this.page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 3000 });
  }

  async clickFreeButton() {
    await this.clickAndAwaitNavigation(this.freeButton);
  }

  async clickPremiumButton() {
    await this.clickAndAwaitNavigation(this.premiumButton);
  }

  async clickTeamsButton() {
    await this.clickAndAwaitNavigation(this.teamsButton);
  }

  async clickEnterpriseButton() {
    await this.clickAndAwaitNavigation(this.enterpriseButton);
  }
}
