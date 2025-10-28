import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { addHeaderSizing } from '../../../express/code/scripts/utils/location-utils.js';

setLibs('/libs');

describe('Location Utils', () => {
  describe('addHeaderSizing', () => {
    let container;
    let mockGetConfig;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);

      mockGetConfig = () => ({
        locale: { region: 'us' },
      });
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should add sizing classes for long headings in non-JP locale', () => {
      container.innerHTML = `
        <h1>This is a very long heading that should trigger the long class</h1>
        <h2>Short</h2>
        <h1>This is an extremely long heading that should trigger multiple sizing classes</h1>
      `;

      addHeaderSizing(container, mockGetConfig);

      const h1Elements = container.querySelectorAll('h1');
      expect(h1Elements[0].classList.contains('heading-long')).to.be.true;
      expect(h1Elements[0].classList.contains('heading-very-long')).to.be.true;
      expect(h1Elements[0].classList.contains('heading-x-long')).to.be.true;

      const h2Element = container.querySelector('h2');
      expect(h2Element.classList.contains('heading-long')).to.be.false;
    });

    it('should add sizing classes for long headings in JP locale', () => {
      mockGetConfig = () => ({
        locale: { region: 'jp' },
      });

      container.innerHTML = `
        <h1>これは非常に長い見出しです</h1>
        <h2>短い</h2>
      `;

      addHeaderSizing(container, mockGetConfig);

      const h1Element = container.querySelector('h1');
      expect(h1Element.classList.contains('heading-long')).to.be.true;
    });

    it('should use custom class prefix', () => {
      container.innerHTML = '<h1>This is a very long heading that should definitely trigger the long class because it has more than thirty characters</h1>';

      addHeaderSizing(container, mockGetConfig, 'title');

      const h1Element = container.querySelector('h1');
      expect(h1Element.classList.contains('title-long')).to.be.true;
    });

    it('should use custom selector', () => {
      container.innerHTML = `
        <h1>Short</h1>
        <h3>This is a very long heading that should trigger the long class</h3>
      `;

      addHeaderSizing(container, mockGetConfig, 'heading', 'h3');

      const h1Element = container.querySelector('h1');
      const h3Element = container.querySelector('h3');

      expect(h1Element.classList.contains('heading-long')).to.be.false;
      expect(h3Element.classList.contains('heading-long')).to.be.true;
    });

    it('should handle mixed Japanese and English text', () => {
      mockGetConfig = () => ({
        locale: { region: 'jp' },
      });

      container.innerHTML = '<h1>Hello こんにちは World 世界</h1>';

      addHeaderSizing(container, mockGetConfig);

      const h1Element = container.querySelector('h1');
      // The function should calculate character count considering both languages
      expect(h1Element.classList.contains('heading-long')).to.be.true;
    });

    it('should handle empty container', () => {
      expect(() => addHeaderSizing(container, mockGetConfig)).to.not.throw();
    });
  });
});
