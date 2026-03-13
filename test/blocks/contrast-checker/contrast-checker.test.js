import { expect } from '@esm-bundle/chai';

function createTag(tag, attributes = {}, content = '') {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  if (content) el.innerHTML = content;
  return el;
}

function parseContent(block) {
  const layout = {};
  const preview = {};
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2) return;

    const key = cols[0].textContent.trim().toLowerCase().replaceAll(/[-_\s]+/g, '');
    const valueCol = cols[1];

    switch (key) {
      case 'pageheading': {
        const h = valueCol.querySelector('h1, h2, h3, h4, h5, h6');
        if (h) layout.heading = h.cloneNode(true);
        break;
      }
      case 'pagesubheading': {
        const p = valueCol.querySelector('p') || valueCol;
        const textContent = p.textContent?.trim();
        if (textContent) {
          layout.paragraph = createTag('p', {}, textContent);
        }
        break;
      }
      case 'previewblockheading': {
        const h = valueCol.querySelector('h1, h2, h3, h4, h5, h6');
        preview.heading = h ? h.textContent.trim() : valueCol.textContent.trim();
        break;
      }
      case 'previewblockdescription': {
        const p = valueCol.querySelector('p') || valueCol;
        preview.description = p.textContent?.trim() || '';
        break;
      }
      case 'previewblockbutton': {
        const a = valueCol.querySelector('a');
        preview.ctaText = a ? a.textContent.trim() : valueCol.textContent.trim();
        break;
      }
      case 'previewblockimage': {
        const pic = valueCol.querySelector('picture');
        if (pic) preview.image = pic.cloneNode(true);
        break;
      }
      default:
        break;
    }
  });

  return { layout, preview };
}

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
  describe('layout content parsing', () => {
    it('parses page-heading with h1 element', () => {
      const block = createBlockWithRows([
        ['page-heading', '<h1>Check your palette\'s color contrast.</h1>'],
      ]);

      const { layout } = parseContent(block);

      expect(layout.heading).to.exist;
      expect(layout.heading.tagName).to.equal('H1');
      expect(layout.heading.textContent).to.equal("Check your palette's color contrast.");
    });

    it('parses page-heading with h2 element', () => {
      const block = createBlockWithRows([
        ['page-heading', '<h2>Color Contrast Checker</h2>'],
      ]);

      const { layout } = parseContent(block);

      expect(layout.heading).to.exist;
      expect(layout.heading.tagName).to.equal('H2');
    });

    it('parses page-sub-heading as paragraph', () => {
      const block = createBlockWithRows([
        ['page-sub-heading', '<p>Help ensure your color choices are accessible.</p>'],
      ]);

      const { layout } = parseContent(block);

      expect(layout.paragraph).to.exist;
      expect(layout.paragraph.tagName).to.equal('P');
      expect(layout.paragraph.textContent).to.equal('Help ensure your color choices are accessible.');
    });

    it('parses page-sub-heading without p wrapper', () => {
      const block = createBlockWithRows([
        ['page-sub-heading', 'Plain text subheading'],
      ]);

      const { layout } = parseContent(block);

      expect(layout.paragraph).to.exist;
      expect(layout.paragraph.textContent).to.equal('Plain text subheading');
    });

    it('handles key variations with dashes, underscores, and spaces', () => {
      const variations = [
        'page-heading',
        'page_heading',
        'page heading',
        'pageheading',
        'PAGE-HEADING',
      ];

      variations.forEach((keyVariant) => {
        const block = createBlockWithRows([
          [keyVariant, '<h1>Test Heading</h1>'],
        ]);
        const { layout } = parseContent(block);
        expect(layout.heading, `Failed for key: ${keyVariant}`).to.exist;
      });
    });
  });

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
    it('parses complete authoring block structure', () => {
      const block = createBlockWithRows([
        ['page-heading', '<h1>Check your palette\'s color contrast.</h1>'],
        ['page-sub-heading', '<p>Help ensure your color choices are accessible by checking the contrast ratio.</p>'],
        ['preview-block-heading', '<h2>We are Roadie</h2>'],
        ['preview-block-description', '<p>Roadie is full service pottery and ceramics studio.</p>'],
        ['preview-block-button', '<a href="#">Shop now</a>'],
        ['preview-block-image', '<picture><img src="pottery.jpg" alt="Pottery"></picture>'],
      ]);

      const { layout, preview } = parseContent(block);

      expect(layout.heading).to.exist;
      expect(layout.heading.textContent).to.equal("Check your palette's color contrast.");
      expect(layout.paragraph).to.exist;
      expect(layout.paragraph.textContent).to.contain('Help ensure your color choices');

      expect(preview.heading).to.equal('We are Roadie');
      expect(preview.description).to.equal('Roadie is full service pottery and ceramics studio.');
      expect(preview.ctaText).to.equal('Shop now');
      expect(preview.image).to.exist;
    });

    it('handles missing optional fields gracefully', () => {
      const block = createBlockWithRows([
        ['page-heading', '<h1>Minimal Block</h1>'],
      ]);

      const { layout, preview } = parseContent(block);

      expect(layout.heading).to.exist;
      expect(layout.paragraph).to.be.undefined;
      expect(preview.heading).to.be.undefined;
      expect(preview.description).to.be.undefined;
      expect(preview.ctaText).to.be.undefined;
      expect(preview.image).to.be.undefined;
    });

    it('ignores rows with less than 2 columns', () => {
      const block = document.createElement('div');
      const singleColRow = document.createElement('div');
      singleColRow.appendChild(document.createElement('div'));
      block.appendChild(singleColRow);

      const { layout, preview } = parseContent(block);

      expect(Object.keys(layout)).to.have.lengthOf(0);
      expect(Object.keys(preview)).to.have.lengthOf(0);
    });
  });
});
