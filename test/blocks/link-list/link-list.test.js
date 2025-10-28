/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/link-list/link-list.js'),
]);
const { default: decorateFn } = imports[1];

document.body.innerHTML = await readFile({ path: './mocks/basic.html' });

describe('Link List', () => {
  before(async () => {
    window.isTestEnv = true;
    const linkList = document.querySelector('.link-list');
    await decorateFn(linkList);
  });

  it('Link list exists', () => {
    const linkList = document.querySelector('.link-list');
    expect(linkList).to.exist;
  });

  it('Link list has the correct structure', () => {
    expect(document.querySelector('.link-list-wrapper')).to.exist;
    expect(document.querySelector('.carousel-container')).to.exist;
    expect(document.querySelector('.carousel-platform')).to.exist;
  });

  it('Link list has buttons with correct classes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    expect(buttons).to.have.length(3);

    buttons.forEach((button) => {
      expect(button.classList.contains('button')).to.be.true;
      expect(button.classList.contains('secondary')).to.be.true;
    });
  });

  it('Buttons have correct href attributes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    expect(buttons[0].getAttribute('href')).to.equal('https://example.com/1');
    expect(buttons[1].getAttribute('href')).to.equal('https://example.com/2');
    expect(buttons[2].getAttribute('href')).to.equal('https://example.com/3');
  });

  it('Buttons have correct text content', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    expect(buttons[0].textContent.trim()).to.equal('Button 1');
    expect(buttons[1].textContent.trim()).to.equal('Button 2');
    expect(buttons[2].textContent.trim()).to.equal('Button 3');
  });

  it('Link list has heading', () => {
    const heading = document.querySelector('.link-list h3');
    expect(heading).to.exist;
    expect(heading.textContent.trim()).to.equal('Test Link List');
  });

  it('Button containers exist', () => {
    const buttonContainers = document.querySelectorAll('.button-container');
    expect(buttonContainers).to.have.length(3);
  });

  it('Carousel platform exists', () => {
    const carouselPlatform = document.querySelector('.carousel-platform');
    expect(carouselPlatform).to.exist;
  });

  it('Buttons have correct base styling classes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    buttons.forEach((button) => {
      expect(button.classList.contains('button')).to.be.true;
      expect(button.classList.contains('secondary')).to.be.true;
    });
  });

  it('Buttons are focusable and have proper attributes', () => {
    const buttons = document.querySelectorAll('.button.secondary');
    buttons.forEach((button) => {
      expect(button.getAttribute('href')).to.exist;
      expect(button.tagName.toLowerCase()).to.equal('a');
    });
  });
});

describe('Link List - Additional Coverage', () => {
  let originalFetch;
  let originalGetLibs;
  let originalGetConfig;
  let originalReplaceKey;

  beforeEach(() => {
    // Mock fetch for external requests
    originalFetch = window.fetch;
    window.fetch = () => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ linkListCategories: 'Category 1, /path1\nCategory 2, /path2' }),
    });

    // Mock getLibs
    originalGetLibs = window.getLibs;
    window.getLibs = () => '/libs';

    // Mock getConfig
    originalGetConfig = window.getConfig;
    window.getConfig = () => ({ locale: { prefix: '/us' } });

    // Mock replaceKey
    originalReplaceKey = window.replaceKey;
    window.replaceKey = () => Promise.resolve('https://example.com/search');
  });

  afterEach(() => {
    window.fetch = originalFetch;
    window.getLibs = originalGetLibs;
    window.getConfig = originalGetConfig;
    window.replaceKey = originalReplaceKey;
  });

  it('should handle normalizeHeadings function', async () => {
    const { normalizeHeadings } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list">
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h4>Heading 4</h4>
      </div>
    `;

    const block = document.querySelector('.link-list');
    normalizeHeadings(block, ['h3']);

    expect(block.querySelector('h1')).to.not.exist;
    expect(block.querySelector('h2')).to.not.exist;
    expect(block.querySelector('h3')).to.exist;
    expect(block.querySelector('h4')).to.not.exist;
  });

  it('should handle smart variant', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list smart">
        <p class="button-container">
          <a href="#" title="test link">Test Link</a>
        </p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateBlock(block);

    expect(block.classList.contains('smart')).to.be.true;
  });

  it('should handle center variant', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list center">
        <p class="button-container">
          <a href="#" title="test link">Test Link</a>
        </p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateBlock(block);

    expect(block.classList.contains('center')).to.be.true;
  });

  it('should handle formatSmartBlockLinks function', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list smart">
        <p class="button-container">
          <a href="#" title="test link">Test Link</a>
        </p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateBlock(block);

    const link = block.querySelector('a');
    expect(link.classList.contains('floating-cta-ignore')).to.be.true;
  });

  it('should handle toggleLinksHighlight function', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list">
        <p class="button-container">
          <a href="https://example.com/test" title="test link">Test Link</a>
        </p>
        <p class="button-container">
          <a href="https://example.com/other" title="other link">Other Link</a>
        </p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateBlock(block);

    expect(block).to.exist;
  });

  it('should handle empty block', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list">
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateBlock(block);

    expect(block).to.exist;
  });

  it('should handle block with no button containers', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list">
        <h3>Heading</h3>
        <p>Some text</p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateBlock(block);

    expect(block).to.exist;
  });

  it('should handle normalizeHeadings with no headings', async () => {
    const { normalizeHeadings } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list">
        <p>Some text</p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    normalizeHeadings(block, ['h3']);

    expect(block.querySelector('p')).to.exist;
  });

  it('should handle formatSmartBlockLinks with no links', async () => {
    const { default: decorateBlock } = await import('../../../express/code/blocks/link-list/link-list.js');

    document.body.innerHTML = `
      <div class="link-list smart">
        <p>Some text</p>
      </div>
    `;

    const block = document.querySelector('.link-list');
    await decorateFn(block);

    expect(block).to.exist;
  });
});
