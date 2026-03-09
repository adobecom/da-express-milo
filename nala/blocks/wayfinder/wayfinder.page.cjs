export default class Wayfinder {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    // section and link-list wrapper
    this.section = page.locator('.section').nth(nth);
    this.wayfinder = page.locator('.wayfinder').nth(nth);

    // Variant locators
    this.variants = {
      borderless: page.locator('.wayfinder.borderless').nth(nth),
      dark: page.locator('.wayfinder.dark').nth(nth),
      gradient: page.locator('.wayfinder.gradient').nth(nth),
      light: page.locator('.wayfinder.light').nth(nth),
    };

    // Default details
    this.defaultPText = this.wayfinder.locator('p');
    this.defaultButton = this.wayfinder.locator('a');

    // Borderless variant details
    this.borderlessVariantContent = this.variants.borderless.locator('div').nth(1);
    this.borderlessVariantButton = this.variants.borderless.locator('a');

    // Dark variant details
    this.darkVariantPText = this.variants.dark.locator('p');
    this.darkVariantButton = this.variants.dark.locator('a');

    // Gradient variant details
    this.gradientVariantPText = this.variants.gradient.locator('p');
    this.gradientVariantButton = this.variants.gradient.locator('a');

    // Light variant details
    this.lightVariantPText = this.variants.light.locator('p');
    this.lightVariantButton = this.variants.light.locator('a');
  }
}
