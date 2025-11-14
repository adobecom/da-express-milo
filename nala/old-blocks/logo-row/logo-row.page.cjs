export default class LogoRow {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    // section and logo-row wrapper
    this.section = page.locator('.section').nth(nth);
    this.logoRow = page.locator('.logo-row').nth(nth);
    this.logoRowHeading = this.logoRow.locator('h5');
    this.logoImage = this.logoRow.locator('picture');
  }
}
