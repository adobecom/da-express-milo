class IconCarouselBlock {
  constructor(page, selector = '.icon-carousel', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Header
    this.header = this.block.locator('.icon-carousel-header');
    this.heading = this.header.locator('h1, h2, h3, h4, h5, h6').first();
    this.subtitle = this.header.locator('p').first();

    // Gallery
    this.gallery = this.block.locator('.icon-carousel-gallery');
    this.cards = this.gallery.locator('.icon-carousel-card');
    this.firstCard = this.cards.first();
    this.cardIcons = this.gallery.locator('.icon-carousel-card-icon');
    this.cardTitles = this.gallery.locator('.icon-carousel-card-body h1, .icon-carousel-card-body h2, .icon-carousel-card-body h3, .icon-carousel-card-body h4, .icon-carousel-card-body h5, .icon-carousel-card-body h6');
    this.cardBodies = this.gallery.locator('.icon-carousel-card-body p');

    // Controls
    this.controls = this.block.locator('.icon-carousel-controls');
    this.prevBtn = this.block.locator('.icon-carousel-prev');
    this.nextBtn = this.block.locator('.icon-carousel-next');
  }
}

module.exports = IconCarouselBlock;
