import { expect } from '@esm-bundle/chai';
import parseContent from '../../../express/code/blocks/contrast-checker/utils/parseContent.js';

function createBlockWithRows(rows) {
  const block = document.createElement('div');
  rows.forEach(([key, value]) => {
    const row = document.createElement('div');
    const keyCol = document.createElement('div');
    keyCol.textContent = key;
    const valueCol = document.createElement('div');
    if (typeof value === 'string') {
      valueCol.innerHTML = value;
    } else {
      valueCol.appendChild(value);
    }
    row.appendChild(keyCol);
    row.appendChild(valueCol);
    block.appendChild(row);
  });
  return block;
}

describe('contrast-checker parseContent', () => {
  describe('preview content parsing', () => {
    it('parses preview-block-heading', () => {
      const block = createBlockWithRows([
        ['preview-block-heading', '<h2>We are Roadie</h2>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('We are Roadie');
    });

    it('parses preview-block-heading without h tag', () => {
      const block = createBlockWithRows([
        ['preview-block-heading', 'Plain Heading Text'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('Plain Heading Text');
    });

    it('parses preview-block-description', () => {
      const block = createBlockWithRows([
        ['preview-block-description', '<p>Roadie is a full service pottery studio.</p>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.description).to.equal('Roadie is a full service pottery studio.');
    });

    it('parses preview-block-button from anchor', () => {
      const block = createBlockWithRows([
        ['preview-block-button', '<a href="#">Shop now</a>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.ctaText).to.equal('Shop now');
    });

    it('parses preview-block-button from plain text', () => {
      const block = createBlockWithRows([
        ['preview-block-button', 'Learn More'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.ctaText).to.equal('Learn More');
    });

    it('parses preview-block-image', () => {
      const block = createBlockWithRows([
        ['preview-block-image', '<picture><img src="test.jpg" alt="test"></picture>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.image).to.exist;
      expect(preview.image.tagName).to.equal('PICTURE');
    });
  });

  describe('full block parsing', () => {
    it('parses complete preview block structure', () => {
      const block = createBlockWithRows([
        ['preview-block-heading', '<h2>We are Roadie</h2>'],
        ['preview-block-description', '<p>Roadie is full service pottery and ceramics studio.</p>'],
        ['preview-block-button', '<a href="#">Shop now</a>'],
        ['preview-block-image', '<picture><img src="pottery.jpg" alt="Pottery"></picture>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('We are Roadie');
      expect(preview.description).to.equal('Roadie is full service pottery and ceramics studio.');
      expect(preview.ctaText).to.equal('Shop now');
      expect(preview.image).to.exist;
    });

    it('handles missing optional fields gracefully', () => {
      const block = createBlockWithRows([
        ['preview-block-heading', '<h2>Minimal</h2>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('Minimal');
      expect(preview.description).to.be.undefined;
      expect(preview.ctaText).to.be.undefined;
      expect(preview.image).to.be.undefined;
    });

    it('ignores rows with less than 2 columns', () => {
      const block = document.createElement('div');
      const singleColRow = document.createElement('div');
      singleColRow.appendChild(document.createElement('div'));
      block.appendChild(singleColRow);

      const { preview } = parseContent(block);

      expect(Object.keys(preview)).to.have.lengthOf(0);
    });

    it('ignores unknown keys', () => {
      const block = createBlockWithRows([
        ['page-heading', '<h1>Should be ignored</h1>'],
        ['preview-block-heading', '<h2>Parsed</h2>'],
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('Parsed');
    });
  });
});
