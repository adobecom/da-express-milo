export default class IconList {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;

    // section and icon-list wrapper
    this.section = page.locator('.section').nth(nth);
    this.iconList = page.locator('.icon-list').nth(nth);

    // Variant locators
    this.variants = {
      fullwidth: page.locator('.icon-list.fullwidth').nth(nth),
    };

    // default
    this.defaultHeading = this.iconList.locator('h5');
    this.defaultContent = this.iconList.locator('p');
    this.defaultIMGImages = this.iconList.locator('img');
    this.defaultSVGImages = this.iconList.locator('svg');

    // Fullwidth variant
    this.fullwidthVariantHeading = this.variants.fullwidth.locator('h5');
    this.fullwidthVariantContent = this.variants.fullwidth.locator('p');
    this.fullwidthVariantIMGImages = this.variants.fullwidth.locator('img');
    this.fullwidthVariantSVGImages = this.variants.fullwidth.locator('svg');
  }
}
