export default class BlogArticleMarquee {
  constructor(page) {
    this.page = page;
    this.section = this.page
      .locator('.section:not([hidden])')
      .filter({ has: this.page.locator('.blog-article-marquee') })
      .first();
    this.block = this.section.locator('.blog-article-marquee').first();
    this.inner = this.block.locator('.blog-article-marquee-inner').first();
    this.contentColumn = this.block.locator('.blog-article-marquee-content').first();
    this.products = this.block.locator('.blog-article-marquee-products').first();
    this.productCards = this.block.locator('.blog-article-marquee-product');
    this.heroImage = this.block.locator('.blog-article-marquee-media img').first();
    this.productImage = this.block.locator('.blog-article-marquee-product-media img').first();
    this.buttonContainer = this.block.locator('.button-container').first();
    this.eyebrow = this.block.locator('.blog-article-marquee-eyebrow').first();
  }

  async gotoURL(url) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForDecoration() {
    await this.block.waitFor({ state: 'visible', timeout: 15000 });
    await this.inner.waitFor({ state: 'visible', timeout: 15000 });
  }

  async scrollToBlock() {
    await this.block.scrollIntoViewIfNeeded();
  }

  async highlightBeforeCTA() {
    return this.block.evaluate((node) => {
      const content = node.querySelector('.blog-article-marquee-content');
      if (!content) return false;
      const highlight = content.querySelector('.blog-article-marquee-products');
      const buttonContainer = content.querySelector('.button-container');
      if (!highlight || !buttonContainer) return false;
      return highlight.nextElementSibling === buttonContainer;
    });
  }

  async getInnerRowCount() {
    return this.block.evaluate((node) => {
      const inner = node.querySelector('.blog-article-marquee-inner');
      if (!inner) return 0;
      return Array.from(inner.children).filter((child) => child.tagName === 'DIV').length;
    });
  }
}
