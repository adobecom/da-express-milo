class TemplateXCarouselToolbarBlock {
  constructor(page, selector = '.template-x-carousel-toolbar', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }

  get images() {
    return this.block.locator('.template img:not(.icon)');
  }

  get videos() {
    return this.block.locator('.template video');
  }

  async getImageDimensions(index) {
    const img = this.images.nth(index);
    await img.scrollIntoViewIfNeeded();
    return img.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        renderedHeight: el.offsetHeight,
        naturalHeight: el.naturalHeight,
        maxHeight: computed.maxHeight,
        height: computed.height,
      };
    });
  }

  async getVideoDimensions(index) {
    const video = this.videos.nth(index);
    await video.scrollIntoViewIfNeeded();
    return video.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        renderedHeight: el.offsetHeight,
        videoHeight: el.videoHeight || 0,
        maxHeight: computed.maxHeight,
        height: computed.height,
      };
    });
  }
}
module.exports = TemplateXCarouselToolbarBlock;
