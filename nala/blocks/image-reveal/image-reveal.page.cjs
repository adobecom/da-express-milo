class ImageRevealBlock {
  constructor(page, selector = '.image-reveal', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.header = this.block.locator('.image-reveal-header');
    this.sandbox = this.block.locator('.image-reveal-sandbox');
    this.panel = this.block.locator('.image-reveal-panel');
    this.stage = this.block.locator('.image-reveal-stage');
    this.originalImage = this.block.locator('.image-reveal-original img');
    this.filteredImage = this.block.locator('.image-reveal-filtered img');
    this.handle = this.block.locator('.image-reveal-handle');
    this.tabs = this.block.locator('[role="tab"]');
    this.tabPanels = this.block.locator('[role="tabpanel"]');
    this.effectRadios = this.block.locator('input[name$="-effect"]');
    this.swapRadios = this.block.locator('input[name$="-image"]');
    this.cta = this.block.locator('.image-reveal-cta a');
  }
}
module.exports = ImageRevealBlock;
