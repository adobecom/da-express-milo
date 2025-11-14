export default class AxColumns {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    // section and ax-columns wrapper
    this.section = page.locator('.section').nth(nth);
    this.axColumns = page.locator('.ax-columns').nth(nth);
    // Variant locators
    this.variants = {
      center: page.locator('.ax-columns.center').nth(nth),
      highlight: page.locator('.ax-columns.highlight').nth(nth),
      centered: page.locator('.ax-columns.centered').nth(nth),
      topCenter: page.locator('.ax-columns.top').nth(nth),
      fullsize: page.locator('.ax-columns.fullsize').nth(nth),
      fullsizeCenter: page.locator('.ax-columns.fullsize-center').nth(nth),
      dark: page.locator('.ax-columns.dark').nth(nth),
      light: page.locator('.ax-columns.light').nth(nth),
      numbered30: page.locator('.ax-columns.numbered-30').nth(nth),
    };
    // Center variant details
    this.centerVariantHeading = this.variants.center.locator('h2');
    this.centerVariantContent = this.variants.center.locator('p');
    this.centerVariantImages = this.variants.center.locator('picture');
    // Highlight variant details
    this.columnVideo = this.variants.highlight.locator('.columns-video');
    this.h4Text = this.columnVideo.locator('h4');
    this.blueButton = this.columnVideo.locator('.button-container a');
    // Inside AxColumns constructor
    this.videoOverlay = page.locator('.video-overlay');
    this.videoPlayer = this.videoOverlay.locator('video');
    this.closeOverlayButton = this.videoOverlay.locator('.close');
  }
}
