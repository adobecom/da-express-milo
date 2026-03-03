class BlogPostsBlock {
  constructor(page, selector = '.blog-posts', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = BlogPostsBlock;
