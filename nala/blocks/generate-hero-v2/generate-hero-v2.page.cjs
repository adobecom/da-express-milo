class GenerateHeroV2Block {
  constructor(page, selector = '.generate-hero-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.logo = this.block.locator('.generate-hero-logo');
    this.heading = this.block.locator('h1, h2, h3, h4, h5, h6').first();
    this.body = this.block.locator('.generate-hero-text > p').first();
    this.form = this.block.locator('.generate-hero-prompt-form');
    this.prompt = this.block.locator('.generate-hero-prompt-input');
    this.generate = this.block.locator('.generate-hero-prompt-submit');
    this.suggestionsLabel = this.block.locator('.generate-hero-suggestions-label');
    this.suggestions = this.block.locator('.generate-hero-suggestion');
    this.gallery = this.block.locator('.generate-hero-gallery');
    this.columns = this.block.locator('.generate-hero-column');
    this.cards = this.block.locator('.generate-hero-card');
    this.images = this.cards.locator('img');
  }
}

module.exports = GenerateHeroV2Block;
