/**
 * Global navigation sign-in / profile selectors.
 * Ported from adobecom/milo `nala/features/feds/header/header.page.js` (FedsHeader).
 */
const { expect } = require('@playwright/test');

class GnavProfile {
  constructor(page) {
    this.page = page;
    this.signInButton = page.locator('button.feds-signIn').first();
    this.profileIcon = page.locator('button.feds-profile-button');
    this.profileModal = page.locator('div#feds-profile-menu');
    this.profileName = page.locator('p.feds-profile-name');
    this.profileEmail = page.locator('p.feds-profile-email');
    this.profileAccountLink = page.locator('p.feds-profile-account');
    this.profileSignOut = page.locator('a.feds-profile-action');
  }

  async openUserProfile() {
    await this.profileIcon.waitFor({ state: 'visible', timeout: 20000 });
    await this.profileIcon.click();
    await expect(this.profileModal).toBeVisible();
  }

  async checkUserProfile() {
    await expect(this.profileName).toBeVisible();
    await expect(this.profileEmail).toBeVisible();
    await expect(this.profileSignOut).toBeVisible();
    await expect(this.profileAccountLink).toBeVisible();
  }
}

module.exports = GnavProfile;
