import { expect } from '@esm-bundle/chai';
import parseContent from '../../../express/code/blocks/color-contrast-checker/utils/parseContent.js';

function createBlockWithRows(rowContents) {
  const block = document.createElement('div');
  rowContents.forEach((content) => {
    const row = document.createElement('div');
    const col = document.createElement('div');
    if (typeof content === 'string') {
      col.innerHTML = content;
    } else {
      col.appendChild(content);
    }
    row.appendChild(col);
    block.appendChild(row);
  });
  return block;
}

describe('color-contrast-checker parseContent', () => {
  describe('preview content parsing', () => {
    it('parses heading from first row', () => {
      const block = createBlockWithRows([
        '<h2>We are Roadie</h2>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('We are Roadie');
    });

    it('parses heading from first row without h tag', () => {
      const block = createBlockWithRows([
        'Plain Heading Text',
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('Plain Heading Text');
    });

    it('parses description from second row', () => {
      const block = createBlockWithRows([
        '<h2>Heading</h2>',
        '<p>Roadie is a full service pottery studio.</p>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.description).to.equal('Roadie is a full service pottery studio.');
    });

    it('parses CTA from link in second row', () => {
      const block = createBlockWithRows([
        '<h2>Heading</h2>',
        '<p>Some description</p><a href="#">Shop now</a>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.ctaText).to.equal('Shop now');
    });

    it('parses image from third row', () => {
      const block = createBlockWithRows([
        '<h2>Heading</h2>',
        '<p>Description</p>',
        '<picture><img src="test.jpg" alt="test"></picture>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.image).to.exist;
      expect(preview.image.tagName).to.equal('PICTURE');
    });
  });

  describe('full block parsing', () => {
    it('parses complete preview block structure', () => {
      const block = createBlockWithRows([
        '<h2>We are Roadie</h2>',
        '<p>Roadie is full service pottery and ceramics studio.</p><a href="#">Shop now</a>',
        '<picture><img src="pottery.jpg" alt="Pottery"></picture>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('We are Roadie');
      expect(preview.description).to.contain('Roadie is full service pottery and ceramics studio.');
      expect(preview.ctaText).to.equal('Shop now');
      expect(preview.image).to.exist;
    });

    it('handles missing optional rows gracefully', () => {
      const block = createBlockWithRows([
        '<h2>Minimal</h2>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('Minimal');
      expect(preview.description).to.be.undefined;
      expect(preview.ctaText).to.be.undefined;
      expect(preview.image).to.be.undefined;
    });

    it('ignores extra rows beyond the third', () => {
      const block = createBlockWithRows([
        '<h2>Heading</h2>',
        '<p>Description</p>',
        '<picture><img src="test.jpg" alt="test"></picture>',
        '<p>Extra row should be ignored</p>',
      ]);

      const { preview } = parseContent(block);

      expect(preview.heading).to.equal('Heading');
      expect(preview.description).to.equal('Description');
      expect(preview.image).to.exist;
    });
  });
});
