export default class ColorHeadlinePage {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.color-headline');
    this.extractBlock = page.locator('.color-headline.extract');
    this.heading = this.block.locator('h1, h2, h3, h4, h5, h6').first();
    this.paragraph = this.block.locator('p').first();
    this.logo = this.block.locator('.express-logo');
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
