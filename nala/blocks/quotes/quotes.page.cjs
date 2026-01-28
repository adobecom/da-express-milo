export default class Quotes {
  constructor(page, nth = 0) {
    this.page = page;
    this.nth = nth;
    // section and link-list wrapper
    this.section = page.locator('.section').nth(nth);
    this.linkList = page.locator('.quotes').nth(nth);

    // Variant locators
    this.variants = {
      defaultVariant: page.locator('.quotes').nth(nth),
      defaultPhotosVariant: page.locator('.quotes').nth(nth),
      singularVariant: page.locator('.quotes.singular').nth(nth),
      carouselVariant: page.locator('.quotes.carousel').nth(nth),
    };

    // Default variant details
    this.defaultVariantQuote = this.variants.defaultVariant.locator('.content p');
    this.defaultVariantAuthorSummary = this.variants.defaultVariant.locator('.author .summary');

    // DefaultPhotos variant details
    this.defaultPhotosVariantQuote = this.variants.defaultPhotosVariant.locator('.content p');
    this.defaultPhotosVariantImage = this.variants.defaultPhotosVariant.locator('.author.image');
    this.defaultPhotosVariantAuthorSummary = this.variants.defaultPhotosVariant.locator('.author .summary');

    // Singular variant details
    this.singularVariantAuthorImage = this.variants.singularVariant.locator('.author-photo').nth(0);
    this.singularVariantQuote = this.variants.singularVariant.locator('.quote-comment');
    this.singularVariantAuthorDescription = this.variants.singularVariant.locator('.author-description');

    // Carousel variant details
    this.carouselVariantAuthorSummary = this.variants.carouselVariant.locator('.author .summary');
    this.carouselVariantQuote = this.variants.carouselVariant.locator('.content p');
    this.carouselVariantLeftArrowButton = this.variants.carouselVariant.locator('.button.basic-carousel-arrow-left');
    this.carouselVariantRightArrowButton = this.variants.carouselVariant.locator('.button.basic-carousel-arrow-right');
  }
}
