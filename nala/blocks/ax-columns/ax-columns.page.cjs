class AxColumnsBlock {
  constructor(page, selector = '.ax-columns', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.videoButton = this.block.locator('a.button.accent').first();
    this.videoOverlay = page.locator('main .video-overlay');
    this.videoPlayer = this.videoOverlay.locator('video');
    this.closeOverlayButton = this.videoOverlay.locator('.close');
  }
}
module.exports = AxColumnsBlock;
