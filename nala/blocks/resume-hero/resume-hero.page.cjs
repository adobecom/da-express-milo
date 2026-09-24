class ResumeHeroBlock {
  constructor(page, selector = '.resume-hero', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = ResumeHeroBlock;
