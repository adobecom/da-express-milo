class TransparentImageMarqueeBlock {
  constructor(page, selector = '.transparent-image-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Layout
    this.foreground = this.block.locator('.foreground');
    this.mainContainer = this.foreground.locator('.main-container');

    // Text content
    this.textContent = this.mainContainer.locator('.text-content');
    this.brandingLogo = this.textContent.locator('.express-logo');
    this.textContainer = this.textContent.locator('.text-container');
    this.heading = this.textContainer.locator('h1, h2, h3, h4, h5, h6').first();
    this.bodyText = this.textContainer.locator('p').first();

    // CTAs + disclaimer
    this.ctaContainer = this.mainContainer.locator('.cta-container');
    this.buttonGroup = this.ctaContainer.locator('.button-group');
    this.primaryCta = this.ctaContainer.locator('.cta.primary');
    this.secondaryCta = this.ctaContainer.locator('.cta.secondary');
    this.disclaimer = this.ctaContainer.locator('.disclaimer');

    // Image
    this.imageContainer = this.foreground.locator('.image-container');
    this.image = this.imageContainer.locator('picture img');
  }
}

module.exports = TransparentImageMarqueeBlock;
