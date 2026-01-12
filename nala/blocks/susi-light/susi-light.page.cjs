module.exports = class SusiLight {
  constructor(page) {
    this.page = page;
    this.block = page.locator('.susi-light').first();
    this.signInButton = this.block.locator('.sign-in-button, button:has-text("Sign in")');
    this.signUpButton = this.block.locator('.sign-up-button, button:has-text("Sign up")');
    this.emailInput = this.block.locator('input[type="email"]');
    this.passwordInput = this.block.locator('input[type="password"]');
    this.submitButton = this.block.locator('button[type="submit"]');
    this.errorMessage = this.block.locator('.error-message, .error');
    this.socialButtons = this.block.locator('.social-button');
    this.googleButton = this.block.locator('button:has-text("Google")');
    this.facebookButton = this.block.locator('button:has-text("Facebook")');
    this.appleButton = this.block.locator('button:has-text("Apple")');
    this.tosLink = this.block.locator('a:has-text("Terms")');
    this.privacyLink = this.block.locator('a:has-text("Privacy")');
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSignIn() {
    await this.signInButton.click();
  }

  async clickSignUp() {
    await this.signUpButton.click();
  }

  async enterEmail(email) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password) {
    await this.passwordInput.fill(password);
  }

  async submitForm() {
    await this.submitButton.click();
  }

  async signInWithEmail(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.submitForm();
  }

  async clickSocialButton(provider) {
    if (provider === 'google') {
      await this.googleButton.click();
    } else if (provider === 'facebook') {
      await this.facebookButton.click();
    } else if (provider === 'apple') {
      await this.appleButton.click();
    }
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }

  async isErrorVisible() {
    return this.errorMessage.isVisible();
  }

  async getSocialButtonCount() {
    return this.socialButtons.count();
  }

  async clickTOS() {
    await this.tosLink.click();
  }

  async clickPrivacy() {
    await this.privacyLink.click();
  }
};
