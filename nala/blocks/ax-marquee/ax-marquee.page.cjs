class AxMarqueeBlock {
  constructor(page, selector = '.ax-marquee', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.axmarquee = page.locator('.ax-marquee');
    this.mainHeading = this.axmarquee.locator('h1');
    this.video = this.axmarquee.locator('video');
    this.text = this.axmarquee.locator('.marquee-foreground p');
    this.expressLogo = page.locator('.express-logo');
    this.ctaButton = this.axmarquee.locator('.button');
    this.reduceMotionWrapper = this.axmarquee.locator('.reduce-motion-wrapper');
    this.reduceMotionPlayVideoBtn = this.axmarquee.locator('.icon-play-video');
    this.reduceMotionPauseVideoBtn = this.axmarquee.locator('.icon-pause-video');
    this.reduceMotionPlayVideoTxt = this.axmarquee.locator('.play-animation-text');
    this.reduceMotionPauseVideoTxt = this.axmarquee.locator('.pause-animation-text');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
module.exports = AxMarqueeBlock;
