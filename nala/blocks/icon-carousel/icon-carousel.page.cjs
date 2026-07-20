class IconCarouselBlock {
  constructor(page, selector = '.icon-carousel', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);

    // Header
    this.header = this.block.locator('.icon-carousel-header');
    this.heading = this.header.locator('h1, h2, h3, h4, h5, h6').first();
    this.subtitle = this.header.locator('p').first();

    // Gallery — the shared gallery widget marks this element
    // role="group" aria-roledescription="carousel" with an accessible name.
    this.gallery = this.block.locator('.icon-carousel-gallery');
    this.cards = this.gallery.locator('.icon-carousel-card');
    this.firstCard = this.cards.first();
    this.cardIcons = this.gallery.locator('.icon-carousel-card-icon');
    this.cardTitles = this.gallery.locator('.icon-carousel-card-body h1, .icon-carousel-card-body h2, .icon-carousel-card-body h3, .icon-carousel-card-body h4, .icon-carousel-card-body h5, .icon-carousel-card-body h6');
    this.cardBodies = this.gallery.locator('.icon-carousel-card-body p');

    // Controls — provided by the shared gallery widget (gallery.js)
    this.controls = this.block.locator('.gallery-control');
    this.prevBtn = this.controls.locator('.prev');
    this.nextBtn = this.controls.locator('.next');
  }
}

module.exports = IconCarouselBlock;
