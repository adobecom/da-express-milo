export default class GridMarqueeHero {
  constructor(page) {
    this.page = page;
    this.hero = page.locator('.grid-marquee-hero');
    this.logo = this.hero.locator('.express-logo');
    this.headline = this.hero.locator('.headline');
    this.heading = this.headline.locator('h1');
    this.ctas = this.headline.locator('.ctas');
    this.ctaButton = this.ctas.locator('a');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
