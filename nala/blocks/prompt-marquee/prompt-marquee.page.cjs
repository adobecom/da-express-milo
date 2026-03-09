export default class PromptMarquee {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    this.section = page.locator('.section').nth(nth);
    this.block = page.locator('.prompt-marquee').nth(nth);
    this.heading = this.block.locator('h1, h2, h3, h4, h5, h6');
    this.bodyCopy = this.block.locator('p');
    this.columns = this.block.locator('.column');
    this.pictureColumns = this.block.locator('.column-picture');
    this.mobilePictureColumns = this.block.locator('.column-picture-mobile');
    this.inputWrapper = this.block.locator('.prompt-marquee-input-wrapper');
    this.input = this.block.locator('.prompt-marquee-input');
    this.ctaContainer = this.block.locator('.cta-with-input');
    this.ctaButton = this.block.locator('a.button, a.con-button');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
