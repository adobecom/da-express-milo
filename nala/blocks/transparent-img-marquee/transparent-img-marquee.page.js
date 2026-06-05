export default class TransparentImgMarqueePage {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.transparent-img-marquee');
    this.foreground = page.locator('.transparent-img-marquee .foreground');
    this.textContent = page.locator('.transparent-img-marquee .text-content');
    this.ctaContainer = page.locator('.transparent-img-marquee .cta-container');
    this.imageContainer = page.locator('.transparent-img-marquee .image-container');
    this.heading = page.locator('.transparent-img-marquee h2').first();
    this.bodyText = page.locator('.transparent-img-marquee .text-content > p:not(.disclaimer)').first();
    this.primaryCta = page.locator('.transparent-img-marquee a.button.accent').first();
    this.secondaryCta = page.locator('.transparent-img-marquee a.button.light').first();
    this.disclaimer = page.locator('.transparent-img-marquee .disclaimer');
    this.image = page.locator('.transparent-img-marquee .image-container img');
    this.logo = page.locator('.transparent-img-marquee .express-logo');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async scrollIntoView() {
    if (await this.block.count()) {
      await this.block.first().scrollIntoViewIfNeeded();
    }
  }
}
