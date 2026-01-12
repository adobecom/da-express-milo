class GenAiCardsBlock {
  constructor(page, selector = '.gen-ai-cards', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = GenAiCardsBlock;
