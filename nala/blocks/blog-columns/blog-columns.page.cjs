class BlogColumnsBlock {
  constructor(page, selector = '.blog-columns', nth = 0) {
    this.page = page;
    this.block = page.locator(selector).nth(nth);
  }
}
module.exports = BlogColumnsBlock;
