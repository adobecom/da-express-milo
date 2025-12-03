module.exports = class BlogPostsV2Block {
  constructor(page, selector) {
    this.page = page;
    this.block = page.locator(selector);
    this.viewAllLink = page.locator('.content a');
    this.blogCards = this.block.locator('.blog-cards');
  }
};
