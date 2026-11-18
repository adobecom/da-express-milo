class ColorHowToCarouselBlock {
  constructor(page, selector = 'main .color-how-to-carousel') {
    this.page = page;
    this.block = page.locator(selector);
    this.pageHeading = page.locator('main h1');
    this.heading = this.block.locator('h2');
    this.numbers = this.block.getByRole('tab');
    this.tips = this.block.locator('.tips > .tip');
    this.activeTip = this.block.locator('.tips > .tip.active');
    this.activeNumber = this.block.locator('.tip-number.active');
    this.graphic = this.block.locator('.img-wrapper, .chtc-graphic');
    this.svg = this.graphic.locator('svg');
    this.cta = this.block.locator('a.button');
    this.howToCard = this.block.locator('.chtc-how-to-card');
    this.specsCard = this.block.locator('.chtc-specs-card');
    this.specRows = this.specsCard.locator('.chtc-specs-row');
    this.toasts = page.locator('.express-toast-container sp-toast[open]');
  }

  tip(index) {
    return this.block.locator(`.tips > .tip-${index + 1}`);
  }

  async howToSchemas() {
    return this.page.locator('head script[type="application/ld+json"]').evaluateAll((scripts) => scripts
      .map((script) => JSON.parse(script.textContent))
      .flatMap((schema) => schema['@graph'] || [schema])
      .filter((schema) => schema['@type'] === 'HowTo'));
  }
}

module.exports = ColorHowToCarouselBlock;
