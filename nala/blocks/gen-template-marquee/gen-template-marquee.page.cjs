class GenTemplateMarqueeBlock {
  constructor(page, selector = '.gen-template-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.logo = this.block.locator('.gen-template-logo');
    this.heading = this.block.locator('h1, h2, h3, h4, h5, h6').first();
    this.body = this.block.locator('.gen-template-text > p').first();
    this.prompt = this.block.locator('.gen-template-prompt-input');
    this.generate = this.block.locator('.gen-template-prompt-submit');
    this.suggestionsLabel = this.block.locator('.gen-template-suggestions-label');
    this.suggestions = this.block.locator('.gen-template-suggestion');
    this.gallery = this.block.locator('.gen-template-gallery');
    this.columns = this.block.locator('.gen-template-column');
    this.cards = this.block.locator('.gen-template-card');
    this.images = this.cards.locator('img');
  }
}

module.exports = GenTemplateMarqueeBlock;
