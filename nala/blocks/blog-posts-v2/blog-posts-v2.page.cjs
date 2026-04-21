class BlogPostsV2Block {
  constructor(page, selector = '.blog-posts-v2', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
    this.viewAllLink = page.locator('.content a');
    this.blogCards = this.block.locator('.blog-cards');

    // Grid variant selectors
    this.blogCard = this.block.locator('a.blog-card');
    this.blogCardImage = this.block.locator('.blog-card-image');
    this.blogCardTitle = this.block.locator('h3.blog-card-title');
    this.blogCardTeaser = this.block.locator('p.blog-card-teaser');
    this.blogCardDate = this.block.locator('p.blog-card-date');
    this.blogTag = this.block.locator('span.blog-tag');
    this.blogPostsHeader = this.block.locator('.blog-posts-header');
    this.loadMore = this.block.locator('.load-more');
    this.loadMoreButton = this.block.locator('.load-more.button');
    this.loadMoreText = this.block.locator('.load-more-text');
  }
}
module.exports = BlogPostsV2Block;
