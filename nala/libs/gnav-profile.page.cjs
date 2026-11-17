/**
 * Global navigation sign-in / profile selectors for FEDS and C2 navigation.
 */
class GnavProfile {
  constructor(page) {
    this.signInButton = page.locator('button.feds-signIn, button[data-test-id="unav-profile--sign-in"]').first();
    this.profileContainer = page.locator('#unav-profile');
  }
}

module.exports = GnavProfile;
