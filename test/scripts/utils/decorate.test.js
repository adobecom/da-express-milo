import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import {
  splitAndAddVariantsWithDash,
  normalizeHeadings,
} from '../../../express/code/scripts/utils/decorate.js';

setLibs('/libs');

describe('Decorate Utils', () => {
  describe('splitAndAddVariantsWithDash', () => {
    it('should split class names with dashes and add variants', () => {
      const block = document.createElement('div');
      block.className = 'block-name fullscreen-center two-part-class';

      splitAndAddVariantsWithDash(block);

      expect(block.classList.contains('fullscreen')).to.be.true;
      expect(block.classList.contains('center')).to.be.true;
      expect(block.classList.contains('two')).to.be.true;
      expect(block.classList.contains('part')).to.be.true;
      expect(block.classList.contains('class')).to.be.true;
    });

    it('should not split the first class (block name)', () => {
      const block = document.createElement('div');
      block.className = 'block-name single-class';

      splitAndAddVariantsWithDash(block);

      expect(block.classList.contains('block-name')).to.be.true;
      expect(block.classList.contains('single')).to.be.true;
      expect(block.classList.contains('class')).to.be.true;
    });

    it('should handle single-word classes (no dashes)', () => {
      const block = document.createElement('div');
      block.className = 'block-name singleword another';

      splitAndAddVariantsWithDash(block);

      expect(block.classList.contains('singleword')).to.be.true;
      expect(block.classList.contains('another')).to.be.true;
      expect(block.classList.contains('single')).to.be.false;
      expect(block.classList.contains('word')).to.be.false;
    });

    it('should handle empty class list', () => {
      const block = document.createElement('div');

      splitAndAddVariantsWithDash(block);

      expect(block.classList.length).to.equal(0);
    });

    it('should handle only block name', () => {
      const block = document.createElement('div');
      block.className = 'block-name';

      splitAndAddVariantsWithDash(block);

      expect(block.classList.contains('block-name')).to.be.true;
      expect(block.classList.length).to.equal(1);
    });

    it('should handle multiple dashes in class names', () => {
      const block = document.createElement('div');
      block.className = 'block-name very-long-class-name';

      splitAndAddVariantsWithDash(block);

      expect(block.classList.contains('very')).to.be.true;
      expect(block.classList.contains('long')).to.be.true;
      expect(block.classList.contains('class')).to.be.true;
      expect(block.classList.contains('name')).to.be.true;
    });
  });

  describe('normalizeHeadings', () => {
    it('should normalize headings to allowed levels', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1><h2>Subtitle</h2><h3>Sub-subtitle</h3>';
      const allowedHeadings = ['h1', 'h2'];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).to.equal(3);
      expect(headings[0].tagName.toLowerCase()).to.equal('h1');
      expect(headings[1].tagName.toLowerCase()).to.equal('h2');
      expect(headings[2].tagName.toLowerCase()).to.equal('h2'); // h3 promoted to h2
    });

    it('should promote headings when current level is too high', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h4>Title</h4><h5>Subtitle</h5>';
      const allowedHeadings = ['h1', 'h2', 'h3'];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings[0].tagName.toLowerCase()).to.equal('h3'); // h4 promoted to h3
      expect(headings[1].tagName.toLowerCase()).to.equal('h3'); // h5 promoted to h3
    });

    it('should downgrade headings when current level is too low', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1><h2>Subtitle</h2>';
      const allowedHeadings = ['h3', 'h4', 'h5'];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings[0].tagName.toLowerCase()).to.equal('h3'); // h1 downgraded to h3
      expect(headings[1].tagName.toLowerCase()).to.equal('h3'); // h2 downgraded to h3
    });

    it('should not change headings that are already allowed', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1><h2>Subtitle</h2>';
      const allowedHeadings = ['h1', 'h2'];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings[0].tagName.toLowerCase()).to.equal('h1');
      expect(headings[1].tagName.toLowerCase()).to.equal('h2');
    });

    it('should handle case insensitive allowed headings', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1><h2>Subtitle</h2>';
      const allowedHeadings = ['H1', 'H2'];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings[0].tagName.toLowerCase()).to.equal('h1');
      expect(headings[1].tagName.toLowerCase()).to.equal('h2');
    });

    it('should preserve text content when normalizing', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h4>Important Title</h4>';
      const allowedHeadings = ['h2'];

      normalizeHeadings(block, allowedHeadings);

      const heading = block.querySelector('h2');
      expect(heading.textContent.trim()).to.equal('Important Title');
    });

    it('should handle empty allowed headings array', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h1>Title</h1>';
      const allowedHeadings = [];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).to.equal(1);
      expect(headings[0].tagName.toLowerCase()).to.equal('h1');
    });

    it('should handle block with no headings', () => {
      const block = document.createElement('div');
      block.innerHTML = '<p>Some text</p>';
      const allowedHeadings = ['h1', 'h2'];

      normalizeHeadings(block, allowedHeadings);

      const headings = block.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).to.equal(0);
    });

    it('should handle headings with extra whitespace', () => {
      const block = document.createElement('div');
      block.innerHTML = '<h4>  Title with spaces  </h4>';
      const allowedHeadings = ['h2'];

      normalizeHeadings(block, allowedHeadings);

      const heading = block.querySelector('h2');
      expect(heading.textContent.trim()).to.equal('Title with spaces');
    });
  });
});
