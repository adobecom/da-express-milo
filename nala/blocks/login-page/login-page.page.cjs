class LoginPageBlock {
  constructor(page, selector = '.login-page', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = LoginPageBlock;
