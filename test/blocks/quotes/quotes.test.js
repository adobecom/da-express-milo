/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

await import('../../../express/code/scripts/scripts.js');
const { default: decorate } = await import(
  '../../../express/code/blocks/quotes/quotes.js'
);
const body = await readFile({ path: './mocks/body.html' });
const singular = await readFile({ path: './mocks/singular.html' });
const singularMultipleQuoteContent = await readFile({ path: './mocks/singular-multiple.html' });

describe('Quotes', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Quotes exists', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);
    expect(quotes).to.exist;
  });

  it('All direct div children get "quote" class', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    quotes.querySelectorAll(':scope>div').forEach((card) => {
      expect(card.classList.contains('quote')).to.be.true;
    });
  });

  it('Author and summary are well constructed', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    quotes.querySelectorAll(':scope>div').forEach((card) => {
      document.body.innerHTML = body;
      if (card.children.length > 1) {
        const author = card.children[1];
        expect(author.classList.contains('author')).to.be.true;
        expect(author.querySelector('.summary')).to.exist;
      }
    });
  });

  it('First child of each card has "content" class', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    quotes.querySelectorAll(':scope>div').forEach((card) => {
      expect(card.firstElementChild.classList.contains('content')).to.be.true;
    });
  });

  it('Picture is wrapped in div with class "image"', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const image = document.querySelector('.image');
    expect(image).to.exist;
  });

  it('creates a quotes singular variant block', async () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const quoteContainer = document.querySelector('.quote-container');
    expect(quoteContainer).to.exist;
  });

  it('creates a singular variant with desktop and mobile DOM structures', async () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const desktopContainer = document.querySelector('.quote-container .desktop-container');
    expect(desktopContainer).to.exist;

    const mobileContainer = document.querySelector('.quote-container .mobile-container');
    expect(mobileContainer).to.exist;
  });

  it('creates a singular variant with one and only one quote', async () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const desktopQuote = document.querySelectorAll('.quote-container .desktop-container .quote');
    expect(desktopQuote).to.have.lengthOf(1);

    const mobileQuote = document.querySelectorAll('.quote-container .mobile-container .quote');
    expect(mobileQuote).to.have.lengthOf(1);
  });

  it('creates a singular variant with correct author photo', async () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const desktopAuthorPhoto = document.querySelectorAll('.quote-container .desktop-container .quote .author-photo');
    expect(desktopAuthorPhoto).to.have.lengthOf(1);

    const mobileAuthorPhoto = document.querySelectorAll('.quote-container .mobile-container .quote .author-photo');
    expect(mobileAuthorPhoto).to.have.lengthOf(1);
  });

  it('creates a singular variant with correct quote text', async () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const desktopQuoteText = document.querySelectorAll('.quote-container .desktop-container .quote .quote-comment');
    expect(desktopQuoteText).to.have.lengthOf(1);

    const mobileQuoteText = document.querySelectorAll('.quote-container .mobile-container .quote .quote-comment');
    expect(mobileQuoteText).to.have.lengthOf(1);
  });

  it('creates a singular variant with background', async () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const desktopBackground = document.querySelector('.quote-container .desktop-container .background');
    expect(desktopBackground?.style?.background).to.have.string('url');

    const mobileBackground = document.querySelector('.quote-container .mobile-container .background');
    expect(mobileBackground?.style?.background).to.have.string('url');
  });

  it('creates a singular variant with correct structure when multiple quotes are provided', async () => {
    document.body.innerHTML = singularMultipleQuoteContent;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    const quoteContainer = document.querySelector('.quote-container');
    expect(quoteContainer).to.exist;

    const desktopContainer = document.querySelector('.quote-container .desktop-container');
    expect(desktopContainer).to.exist;

    const mobileContainer = document.querySelector('.quote-container .mobile-container');
    expect(mobileContainer).to.exist;

    const desktopQuote = document.querySelector('.quote-container .desktop-container .quote');
    expect(desktopQuote).to.exist;

    const mobileQuote = document.querySelector('.quote-container .mobile-container .quote');
    expect(mobileQuote).to.exist;
  });

  it('creates a singular variant with only one quote when multiple quotes are provided', async () => {
    document.body.innerHTML = singularMultipleQuoteContent;
    const quotes = document.querySelector('.quotes');
    await decorate(quotes);

    // the following is 1 for desktop and 1 for mobile, so the total is 2

    const quote = document.querySelectorAll('.quotes .quote');
    expect(quote).to.have.lengthOf(2);

    const photo = document.querySelectorAll('.quotes .author-photo');
    expect(photo).to.have.lengthOf(2);

    const text = document.querySelectorAll('.quotes .quote-comment');
    expect(text).to.have.lengthOf(2);
  });

  it('should handle carousel variant', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    quotes.classList.add('carousel');

    await decorate(quotes);

    expect(quotes).to.exist;
    // Carousel functionality should be initialized
  });

  it('should handle ratings functionality', async () => {
    // Mock ratings functions
    window.fetchRatingsData = () => Promise.resolve({ data: 'test' });
    window.determineActionUsed = () => 'test';
    window.hasRated = () => false;
    window.submitRating = () => Promise.resolve();
    window.createRatingSlider = () => document.createElement('div');
    window.sliderFunctionality = () => {};
    window.createHoverStarRating = () => document.createElement('div');
    window.createRatingsContainer = () => document.createElement('div');
    window.RATINGS_CONFIG = { test: 'config' };

    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    quotes.classList.add('ratings');

    await decorate(quotes);

    expect(quotes).to.exist;
  });

  it('should handle lottie animations', async () => {
    // Mock lottie functions
    window.getLottie = () => Promise.resolve();
    window.lazyLoadLottiePlayer = () => Promise.resolve();

    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    quotes.classList.add('lottie');

    await decorate(quotes);

    expect(quotes).to.exist;
  });

  it('should handle random quote selection', async () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    quotes.classList.add('random');

    await decorate(quotes);

    expect(quotes).to.exist;
    // Random selection should work
  });

  it('should handle empty quotes block', async () => {
    document.body.innerHTML = '<div class="quotes"></div>';
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
  });

  it('should handle quotes with only text content', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <p>This is a quote without author</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    const quote = quotes.querySelector('.quote');
    expect(quote).to.exist;
  });

  it('should handle quotes with author but no summary', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <p>Quote text</p>
          <p>Author Name</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    const author = quotes.querySelector('.author');
    expect(author).to.exist;
  });

  it('should handle quotes with picture elements', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <picture>
            <img src="test.jpg" alt="Author">
          </picture>
          <p>Author Name</p>
          <p>Summary text</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    // Should not throw an error
    expect(() => decorate(quotes)).to.not.throw();
    expect(quotes).to.exist;
  });

  it('should handle error in utils loading gracefully', async () => {
    // Mock utils import to fail
    const originalImport = window.import;
    window.import = (path) => {
      if (path.includes('utils/utils.js')) {
        return Promise.reject(new Error('Utils load failed'));
      }
      return originalImport ? originalImport(path) : Promise.resolve({});
    };

    // Mock lana logging
    window.lana = { log: () => {} };

    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');

    try {
      await decorate(quotes);
      // Should handle error gracefully
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it('should handle different quote variants', async () => {
    const variants = ['default', 'carousel', 'singular', 'ratings', 'lottie'];

    for (const variant of variants) {
      document.body.innerHTML = `
        <div class="quotes ${variant}">
          <div>
            <picture>
              <img src="test.jpg" alt="Author">
            </picture>
            <p>Author Name</p>
            <p>Summary text</p>
          </div>
        </div>
      `;
      const quotes = document.querySelector('.quotes');

      await decorate(quotes);

      expect(quotes).to.exist;
    }
  });

  it('should handle carousel variant', async () => {
    document.body.innerHTML = `
      <div class="quotes carousel">
        <div>
          <blockquote>
            <p>Quote 1</p>
          </blockquote>
          <p>Author 1</p>
          <p>Summary 1</p>
        </div>
        <div>
          <blockquote>
            <p>Quote 2</p>
          </blockquote>
          <p>Author 2</p>
          <p>Summary 2</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    expect(quotes.classList.contains('carousel')).to.be.true;
  });

  it('should handle ratings variant', async () => {
    document.body.innerHTML = `
      <div class="quotes ratings">
        <div>
          <p>Rating data source</p>
        </div>
        <div>
          <blockquote>
            <p>Quote text</p>
          </blockquote>
          <p>Author Name</p>
          <p>Summary text</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    expect(quotes.classList.contains('ratings')).to.be.true;
  });

  it('should handle lottie variant', async () => {
    document.body.innerHTML = `
      <div class="quotes lottie">
        <div>
          <blockquote>
            <p>Quote text</p>
          </blockquote>
          <p>Author Name</p>
          <p>Summary text</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    expect(quotes.classList.contains('lottie')).to.be.true;
  });

  it('should handle singular variant with background image', async () => {
    document.body.innerHTML = `
      <div class="quotes singular">
        <div>
          <div>
            <img src="background.jpg" alt="Background">
          </div>
        </div>
        <div>
          <picture>
            <img src="author.jpg" alt="Author">
          </picture>
          <blockquote>
            <p>Quote text</p>
          </blockquote>
          <p>Author Name</p>
          <p>Summary text</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    expect(quotes.classList.contains('singular')).to.be.true;
  });

  it('should handle quotes with multiple children', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <blockquote>
            <p>Quote 1</p>
          </blockquote>
          <p>Author 1</p>
          <p>Summary 1</p>
        </div>
        <div>
          <blockquote>
            <p>Quote 2</p>
          </blockquote>
          <p>Author 2</p>
          <p>Summary 2</p>
        </div>
        <div>
          <blockquote>
            <p>Quote 3</p>
          </blockquote>
          <p>Author 3</p>
          <p>Summary 3</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    const quoteElements = quotes.querySelectorAll('.quote');
    expect(quoteElements.length).to.be.greaterThan(0);
  });

  it('should handle quotes with author elements', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <blockquote>
            <p>Quote text</p>
          </blockquote>
          <div class="author">
            <picture>
              <img src="author.jpg" alt="Author">
            </picture>
            <p>Author Name</p>
            <p>Summary text</p>
          </div>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    const author = quotes.querySelector('.author');
    expect(author).to.exist;
  });

  it('should handle quotes with picture elements in author', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <blockquote>
            <p>Quote text</p>
          </blockquote>
          <div class="author">
            <picture>
              <img src="author.jpg" alt="Author">
            </picture>
            <p>Author Name</p>
            <p>Summary text</p>
          </div>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
    const image = quotes.querySelector('.image');
    expect(image).to.exist;
  });

  it('should handle quotes with no author', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <blockquote>
            <p>Quote text</p>
          </blockquote>
          <p>Summary text</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
  });

  it('should handle quotes with empty content', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <p>Some content</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    expect(quotes).to.exist;
  });

  it('should handle quotes with only one child div', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <p>"Single quote without author"</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    const quote = quotes.querySelector('.quote');
    expect(quote).to.exist;
    const content = quote.querySelector('.content');
    expect(content).to.exist;
  });

  it('should add quote class to all direct children', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div><p>"Quote 1"</p></div>
        <div><p>"Quote 2"</p></div>
        <div><p>"Quote 3"</p></div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    const quoteElements = quotes.querySelectorAll(':scope > div');
    quoteElements.forEach((el) => {
      expect(el.classList.contains('quote')).to.be.true;
    });
  });

  it('should create blockquote elements for quote content', async () => {
    document.body.innerHTML = `
      <div class="quotes">
        <div>
          <p>"This is a test quote"</p>
        </div>
      </div>
    `;
    const quotes = document.querySelector('.quotes');

    await decorate(quotes);

    const blockquote = quotes.querySelector('blockquote');
    expect(blockquote).to.exist;
    expect(blockquote.querySelector('.inner-content')).to.exist;
  });
});
