export default class Banner {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;

    // section and banner wrapper
    this.section = page.locator('.section').nth(nth);
    this.banner = page.locator('.banner').nth(nth);

    // Variant locators
    this.variants = {
      light: page.locator('.banner.light').nth(nth),
      standout: page.locator('.banner.standout').nth(nth),
      cool: page.locator('.banner.cool').nth(nth),
    };

    // Default banner details
    this.defaultBannerHeading = this.banner.locator('h2');
    this.defaultBannerHeading3 = this.banner.locator('h3');
    this.defaultBannerButton = this.banner.locator('a');

    // Light variant details
    this.lightVariantHeading = this.variants.light.locator('h2');
    this.lightVariantContent = this.variants.light.locator('p').nth(0);
    this.lightVariantButton = this.variants.light.locator('a').nth(0);
    this.lightVariantButton2 = this.variants.light.locator('a').nth(1);
    this.lightVariantButton3 = this.variants.light.locator('a').nth(2);

    // Standout variant details
    this.standoutVariantHeading = this.variants.standout.locator('h2');
    this.standoutVariantButton = this.variants.standout.locator('a');

    // Cool variant details
    this.coolVariantHeading = this.variants.cool.locator('h2');
    this.coolVariantButton = this.variants.cool.locator('a').nth(0);
  }
}
