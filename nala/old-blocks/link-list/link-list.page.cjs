export default class LinkList {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    // section and link-list wrapper
    this.section = page.locator('.section').nth(nth);
    this.linkList = page.locator('.link-list').nth(nth);

    // Variant locators
    this.variants = {
      centered: page.locator('.link-list.centered').nth(nth),
      large: page.locator('.link-list.large').nth(nth),
      shaded: page.locator('.link-list.shaded').nth(nth),
      leftalign: page.locator('.link-list.leftalign').nth(nth),
      fullwidth: page.locator('.link-list.fullwidth').nth(nth),
      noarrows: page.locator('.link-list.noarrows').nth(nth),
    };

    // Centered variant details
    this.centeredVariantHeading = this.variants.centered.locator('h3');
    this.centeredVariantButton1 = this.variants.centered.locator('a').nth(0);
    this.centeredVariantButton2 = this.variants.centered.locator('a').nth(1);

    // Large variant details
    this.largeVariantButton1 = this.variants.large.locator('a').nth(0);
    this.largeVariantButton2 = this.variants.large.locator('a').nth(1);

    // Shaded variant details
    this.shadedVariantButton1 = this.variants.shaded.locator('a').nth(0);
    this.shadedVariantButton2 = this.variants.shaded.locator('a').nth(1);

    // Leftalign variant details
    this.leftalignVariantHeading = this.variants.leftalign.locator('h3');
    this.leftalignVariantButton1 = this.variants.leftalign.locator('a').nth(0);
    this.leftalignVariantButton2 = this.variants.leftalign.locator('a').nth(1);

    // Fullwidth variant details
    this.fullwidthVariantHeading = this.variants.fullwidth.locator('h3');
    this.fullwidthVariantButton1 = this.variants.fullwidth.locator('a').nth(0);
    this.fullwidthVariantButton2 = this.variants.fullwidth.locator('a').nth(1);

    // Noarrows variant details
    this.noarrowsVariantButton1 = this.variants.noarrows.locator('a').nth(0);
    this.noarrowsVariantButton2 = this.variants.noarrows.locator('a').nth(1);
  }
}
