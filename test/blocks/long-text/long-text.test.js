/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

await import('../../../express/code/scripts/scripts.js');
// eslint-disable-next-line max-len
const imports = await Promise.all([import('../../../express/code/blocks/long-text/long-text.js')]);
const { default: decorate } = imports[0];

const body = await readFile({ path: './mocks/body.html' });
const noLongTextWrapper = await readFile({ path: './mocks/no-long-text-wrapper.html' });
const longTextWrapper = await readFile({ path: './mocks/long-text-wrapper.html' });

describe('Long Text', () => {
  before(() => {
    window.isTestEnv = true;
  });
  it('Long Text exists', () => {
    document.body.innerHTML = body;
    const longText = document.querySelector('.long-text');
    decorate(longText);
    expect(longText).to.exist;
  });

  it('Long Text contains the right elements if block contains plain class', () => {
    document.body.innerHTML = body;
    console.log('THE LONG TEXT  ');
    console.log(document.querySelector('.long-text'));
    const longText = document.querySelector('.long-text');
    decorate(longText);

    const plain = document.querySelector('.plain');
    expect(plain).to.exist;
    expect(plain.classList.contains('plain')).to.be.true;
  });

  it('Empty text content parent without long-text-wrapper should be removed', () => {
    document.body.innerHTML = noLongTextWrapper;
    const longText = document.querySelector('.long-text');
    decorate(longText);

    const removedBlock = document.querySelector('.long-text');
    expect(removedBlock).to.not.exist;
  });

  it('Empty Content parent element removed if it contains long-text-wrapper', () => {
    document.body.innerHTML = longTextWrapper;
    const longText = document.querySelector('.long-text');
    decorate(longText);

    const removedParentElement = document.querySelector('.long-text-wrapper');
    expect(removedParentElement).to.not.exist;
  });

  describe('No-background variant functionality', () => {
    it('should render multiple paragraphs per H2 in no-background variant', () => {
      const html = `
        <div class="long-text no-background">
          <div>
            <div>
              <h2>First Section</h2>
              <p>First paragraph</p>
              <p>Second paragraph</p>
              <p>Third paragraph</p>
            </div>
          </div>
          <div>
            <div>
              <h2>Second Section</h2>
              <p>Another paragraph</p>
              <p>Yet another paragraph</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const articles = longText.querySelectorAll('article');
      expect(articles).to.have.length(2);

      // First article should have H2 + 3 paragraphs
      const firstArticle = articles[0];
      expect(firstArticle.querySelector('h2')).to.exist;
      expect(firstArticle.querySelectorAll('p')).to.have.length(3);

      // Second article should have H2 + 2 paragraphs
      const secondArticle = articles[1];
      expect(secondArticle.querySelector('h2')).to.exist;
      expect(secondArticle.querySelectorAll('p')).to.have.length(2);
    });

    it('should filter out empty paragraphs in no-background variant', () => {
      const html = `
        <div class="long-text no-background">
          <div>
            <div>
              <h2>Test Section</h2>
              <p>Valid paragraph</p>
              <p></p>
              <p>   </p>
              <p>Another valid paragraph</p>
              <p>null</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const article = longText.querySelector('article');
      const paragraphs = article.querySelectorAll('p');

      // Should only have 2 valid paragraphs
      expect(paragraphs).to.have.length(2);
      expect(paragraphs[0].textContent).to.equal('Valid paragraph');
      expect(paragraphs[1].textContent).to.equal('Another valid paragraph');
    });

    it('should handle no-background variant with only H2 and no paragraphs', () => {
      const html = `
        <div class="long-text no-background">
          <div>
            <div>
              <h2>Section with no paragraphs</h2>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const article = longText.querySelector('article');
      expect(article).to.exist;
      expect(article.querySelector('h2')).to.exist;
      expect(article.querySelectorAll('p')).to.have.length(0);
    });

    it('should add no-background class to wrapper', () => {
      const html = `
        <div class="long-text no-background">
          <div>
            <div>
              <h2>Test</h2>
              <p>Content</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const wrapper = longText.parentElement;
      expect(wrapper.classList.contains('no-background')).to.be.true;
    });
  });

  describe('Empty paragraph filtering', () => {
    it('should remove empty paragraphs from all long-text blocks', () => {
      const html = `
        <div class="long-text">
          <div>
            <div>
              <h2>Test Section</h2>
              <p>Valid paragraph</p>
              <p></p>
              <p>   </p>
              <p>Another valid paragraph</p>
              <p>null</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const paragraphs = longText.querySelectorAll('p');

      // Should only have 2 valid paragraphs
      expect(paragraphs).to.have.length(2);
      expect(paragraphs[0].textContent).to.equal('Valid paragraph');
      expect(paragraphs[1].textContent).to.equal('Another valid paragraph');
    });

    it('should remove paragraphs with only whitespace', () => {
      const html = `
        <div class="long-text">
          <div>
            <div>
              <p>   </p>
              <p>\t\n</p>
              <p>Valid content</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const paragraphs = longText.querySelectorAll('p');
      expect(paragraphs).to.have.length(1);
      expect(paragraphs[0].textContent).to.equal('Valid content');
    });

    it('should remove paragraphs with null content', () => {
      const html = `
        <div class="long-text">
          <div>
            <div>
              <p>null</p>
              <p>Valid content</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const paragraphs = longText.querySelectorAll('p');
      expect(paragraphs).to.have.length(1);
      expect(paragraphs[0].textContent).to.equal('Valid content');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle no-background variant with no H2 elements', () => {
      const html = `
        <div class="long-text no-background">
          <div>
            <div>
              <p>Just paragraphs</p>
              <p>No headings</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      // Should not create article structure without H2
      const articles = longText.querySelectorAll('article');
      expect(articles).to.have.length(0);

      // Original structure should remain
      const paragraphs = longText.querySelectorAll('p');
      expect(paragraphs).to.have.length(2);
    });

    it('should handle mixed content with valid and invalid paragraphs', () => {
      const html = `
        <div class="long-text no-background">
          <div>
            <div>
              <h2>Section 1</h2>
              <p>Valid paragraph 1</p>
              <p></p>
              <p>Valid paragraph 2</p>
              <h2>Section 2</h2>
              <p>   </p>
              <p>Valid paragraph 3</p>
              <p>null</p>
            </div>
          </div>
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      decorate(longText);

      const articles = longText.querySelectorAll('article');
      expect(articles).to.have.length(2);

      // First article: H2 + 2 valid paragraphs
      expect(articles[0].querySelectorAll('p')).to.have.length(2);

      // Second article: H2 + 1 valid paragraph
      expect(articles[1].querySelectorAll('p')).to.have.length(1);
    });

    it('should remove empty block when not in long-text-wrapper', () => {
      const html = `
        <div class="long-text">
        </div>
      `;
      document.body.innerHTML = html;
      const longText = document.querySelector('.long-text');
      const { parentElement } = longText;

      decorate(longText);

      // Block should be removed directly since parent is not long-text-wrapper
      expect(document.querySelector('.long-text')).to.be.null;
      expect(parentElement.children).to.have.length(0);
    });
  });
});
