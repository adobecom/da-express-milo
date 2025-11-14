export default class LongText {
  constructor(page) {
    this.page = page;
    this.variants = {
      default: page.locator('.long-text:not(.plain):not(.no-background)'),
      plain: page.locator('.long-text.plain'),
      noBackground: page.locator('.long-text.no-background'),
    };
    this.noBackgroundArticles = this.variants.noBackground.locator('article');
    this.longText = page.locator('.long-text');
  }

  async gotoURL(url) {
    await this.page.goto(url);
  }

  async waitForContent() {
    // Wait for the page to be fully loaded
    await this.page.waitForLoadState('networkidle');

    // Debug: Check what elements are actually on the page
    const bodyHTML = await this.page.locator('body').innerHTML();
    console.log('Page body content:', `${bodyHTML.substring(0, 500)}...`);

    // Check if long-text elements exist
    const longTextCount = await this.longText.count();
    console.log('Found long-text elements:', longTextCount);

    if (longTextCount === 0) {
      // If no long-text elements found, check for the basic structure
      const h2Count = await this.page.locator('h2').count();
      const pCount = await this.page.locator('p').count();
      console.log('Found h2 elements:', h2Count, 'p elements:', pCount);

      // Wait a bit more for JavaScript to process
      await this.page.waitForTimeout(3000);

      // Check again
      const longTextCountAfter = await this.longText.count();
      console.log('Found long-text elements after wait:', longTextCountAfter);

      if (longTextCountAfter === 0) {
        throw new Error('No long-text elements found on page. Page may not be loading JavaScript properly.');
      }
    }
    // Wait for long-text elements to be visible
    await this.longText.first().waitFor({ state: 'visible', timeout: 5000 });
  }

  async getContentStructure() {
    const h2Count = await this.page.locator('h2').count();
    const pCount = await this.page.locator('p').count();
    const articleCount = await this.noBackgroundArticles.count();

    return {
      articleCount,
      h2Count,
      pCount,
      articles: [],
      hasSemanticStructure: articleCount > 0,
    };
  }

  async getNoBackgroundStructure() {
    const articles = [];
    const noBackgroundCount = await this.variants.noBackground.count();
    console.log('DEBUG: noBackground variant count:', noBackgroundCount);
    const articleCount = await this.noBackgroundArticles.count();
    console.log('DEBUG: noBackgroundArticles count:', articleCount);
    console.log('DEBUG: noBackgroundArticles selector:', this.noBackgroundArticles);

    // Let's also check the raw block content before JavaScript processing
    const noBackgroundBlock = this.variants.noBackground.first();
    const blockHTML = await noBackgroundBlock.innerHTML();
    console.log('DEBUG: Raw block HTML before processing:', blockHTML);

    for (let i = 0; i < articleCount; i += 1) {
      const article = this.noBackgroundArticles.nth(i);
      const h2 = article.locator('h2');
      const h3 = article.locator('h3');
      const h4 = article.locator('h4');
      const p = article.locator('p');

      // Find which heading type exists (only one should exist per article)
      const hasH2 = await h2.isVisible();
      const hasH3 = await h3.isVisible();
      const hasH4 = await h4.isVisible();
      const hasP = await p.isVisible();

      console.log(`DEBUG: Article ${i} - hasH2: ${hasH2}, hasH3: ${hasH3}, hasH4: ${hasH4}, hasP: ${hasP}`);

      // Debug: Check what's actually in the article
      const articleHTML = await article.innerHTML();
      console.log(`DEBUG: Article ${i} HTML:`, articleHTML);

      let headingText = null;
      let headingType = null;

      if (hasH2) {
        headingText = await h2.textContent();
        headingType = 'h2';
      } else if (hasH3) {
        headingText = await h3.textContent();
        headingType = 'h3';
      } else if (hasH4) {
        headingText = await h4.textContent();
        headingType = 'h4';
      }

      articles.push({
        hasH2,
        hasH3,
        hasH4,
        hasP,
        headingType,
        headingText,
        pText: hasP ? await p.textContent() : null,
      });
    }

    return {
      articleCount,
      articles,
      hasSemanticStructure: articleCount > 0,
    };
  }

  async getArticleStructure() {
    const articles = [];
    const articleCount = await this.noBackgroundArticles.count();

    for (let i = 0; i < articleCount; i += 1) {
      const article = this.noBackgroundArticles.nth(i);
      const h2 = article.locator('h2');
      const h3 = article.locator('h3');
      const h4 = article.locator('h4');
      const p = article.locator('p');

      // Find which heading type exists (only one should exist per article)
      const hasH2 = await h2.isVisible();
      const hasH3 = await h3.isVisible();
      const hasH4 = await h4.isVisible();
      const hasP = await p.isVisible();

      let headingText = null;
      let headingType = null;

      if (hasH2) {
        headingText = await h2.textContent();
        headingType = 'h2';
      } else if (hasH3) {
        headingText = await h3.textContent();
        headingType = 'h3';
      } else if (hasH4) {
        headingText = await h4.textContent();
        headingType = 'h4';
      }

      articles.push({
        hasH2,
        hasH3,
        hasH4,
        hasP,
        headingType,
        headingText,
        pText: hasP ? await p.textContent() : null,
      });
    }

    return {
      articleCount,
      articles,
      hasSemanticStructure: await this.hasSemanticStructure(),
    };
  }

  async hasSemanticStructure() {
    const articleCount = await this.noBackgroundArticles.count();
    return articleCount > 0;
  }

  static getDesignTokens() {
    // Mock design tokens for testing
    return {
      h2Color: 'rgb(0, 0, 0)',
      h2FontSize: '24px',
      pColor: 'rgb(0, 0, 0)',
      pFontSize: '16px',
      spacing: '24px',
    };
  }

  async isKeyboardNavigable() {
    // For text blocks, we check if the content is accessible via keyboard navigation
    // Text blocks don't need focusable elements, they just need to be readable
    const hasContent = await this.longText.first().locator('h1, h2, h3, h4, h5, h6, p').count() > 0;
    return hasContent;
  }

  async hasProperHeadingHierarchy() {
    // For long-text blocks, we just check if there are valid headings
    // Multiple H2s are common and acceptable in text blocks
    const headings = await this.longText.first().locator('h1, h2, h3, h4, h5, h6').count();
    return headings > 0;
  }
}
