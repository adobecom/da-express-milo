export default class QuotesRatings {
  constructor(page) {
    this.page = page;

    // Main block
    this.block = page.locator('.quotes.ratings, .quotes.carousel.ratings');
    this.section = page.locator('.section').filter({ has: this.block });

    // Rating elements
    this.ratingStars = this.block.locator('.star, [data-rating]');
    this.ratingForm = this.block.locator('form, .rating-form');
    this.commentBox = this.block.locator('textarea, input[type="text"]');
    this.submitButton = this.block.locator('input[type="submit"], button[type="submit"]');

    // Timer/countdown
    this.timer = this.block.locator('.timer');
    this.lottieAnimation = this.block.locator('lottie-player, .lottie');

    // Already rated state
    this.alreadyRatedMessage = this.block.locator('.submitted, .no-slider');
    this.alreadyRatedTitle = this.alreadyRatedMessage.locator('h3');
    this.alreadyRatedText = this.alreadyRatedMessage.locator('p');

    // Success state
    this.successMessage = this.block.locator('.success, .thank-you');

    // Carousel specific
    this.carouselPrevButton = this.block.locator('button.prev, .arrow-prev');
    this.carouselNextButton = this.block.locator('button.next, .arrow-next');
    this.carouselSlides = this.block.locator('.quote-slide, .carousel-item');
  }

  /**
   * Select a rating by clicking a star
   * @param {number} rating - Rating value (1-5)
   */
  async selectRating(rating) {
    const star = this.ratingStars.filter({ hasText: String(rating) }).or(
      this.block.locator(`[data-rating="${rating}"]`),
    );
    await star.first().click();
  }

  /**
   * Hover over a rating star
   * @param {number} rating - Rating value (1-5)
   */
  async hoverRating(rating) {
    const star = this.block.locator(`[data-rating="${rating}"]`).first();
    await star.hover();
  }

  /**
   * Add a comment to the rating
   * @param {string} comment - Comment text
   */
  async addComment(comment) {
    await this.commentBox.fill(comment);
  }

  /**
   * Submit the rating
   */
  async submitRating() {
    await this.submitButton.click();
  }

  /**
   * Wait for timer to complete (10 seconds)
   * @param {number} timeout - Timeout in milliseconds
   */
  async waitForAutoSubmit(timeout = 12000) {
    await this.page.waitForTimeout(timeout);
  }

  /**
   * Check if timer is visible
   * @returns {Promise<boolean>}
   */
  async isTimerVisible() {
    return this.timer.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Check if already rated
   * @returns {Promise<boolean>}
   */
  async isAlreadyRated() {
    return this.alreadyRatedMessage.isVisible({ timeout: 2000 }).catch(() => false);
  }

  /**
   * Navigate carousel to next quote
   */
  async nextQuote() {
    await this.carouselNextButton.click();
    await this.page.waitForTimeout(500); // Wait for transition
  }

  /**
   * Navigate carousel to previous quote
   */
  async prevQuote() {
    await this.carouselPrevButton.click();
    await this.page.waitForTimeout(500); // Wait for transition
  }

  /**
   * Get current quote index in carousel
   * @returns {Promise<number>}
   */
  async getCurrentQuoteIndex() {
    // Try to find active indicator or calculate from transform
    const activeSlide = await this.carouselSlides.filter({ hasClass: /active|current/ }).count();
    return activeSlide > 0 ? activeSlide - 1 : 0;
  }

  /**
   * Complete rating flow: select, comment, submit
   * @param {number} rating - Rating value (1-5)
   * @param {string} comment - Optional comment
   */
  async completeRating(rating, comment = '') {
    await this.selectRating(rating);
    if (comment) {
      await this.addComment(comment);
    }
    await this.submitRating();
  }
}
