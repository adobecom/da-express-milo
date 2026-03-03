class BlogPostsV2Block {
  constructor(page, selector = '.blog-posts-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.viewAllLink = page.locator('.content a');
    this.blogCards = this.block.locator('.blog-cards');
  }
}
module.exports = BlogPostsV2Block;
