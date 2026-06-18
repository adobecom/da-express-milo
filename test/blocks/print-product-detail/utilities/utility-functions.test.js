import { expect } from '@esm-bundle/chai';
import {
  createHeroImageSrcset,
  extractInitialImageUrl,
} from '../../../../express/code/blocks/print-product-detail/utilities/utility-functions.js';

function makeBlock(rows) {
  const block = document.createElement('div');
  rows.forEach(([key, valueNode]) => {
    const row = document.createElement('div');
    const keyCell = document.createElement('div');
    keyCell.textContent = key;
    const valueCell = document.createElement('div');
    if (typeof valueNode === 'string') {
      valueCell.textContent = valueNode;
    } else if (valueNode) {
      valueCell.appendChild(valueNode);
    }
    row.appendChild(keyCell);
    row.appendChild(valueCell);
    block.appendChild(row);
  });
  return block;
}

describe('createHeroImageSrcset', () => {
  const BASE_URL = 'https://rlv.zcache.com/image/123.jpg';

  it('returns a srcset string with exactly 4 entries', () => {
    const srcset = createHeroImageSrcset(BASE_URL);
    const entries = srcset.split(', ');
    expect(entries).to.have.length(4);
  });

  it('sets the correct max_dim and width descriptor for each breakpoint', () => {
    const srcset = createHeroImageSrcset(BASE_URL);
    const entries = srcset.split(', ');
    const widths = [400, 800, 1200, 1600];
    widths.forEach((w, i) => {
      expect(entries[i]).to.include(`max_dim=${w}`);
      expect(entries[i]).to.match(new RegExp(`${w}w$`));
    });
  });

  it('overwrites an existing max_dim param rather than duplicating it', () => {
    const urlWithParam = `${BASE_URL}?max_dim=999`;
    const srcset = createHeroImageSrcset(urlWithParam);
    expect(srcset).to.not.include('max_dim=999');
    expect(srcset).to.not.include('max_dim=999&max_dim=');
  });

  it('falls back gracefully for an invalid URL', () => {
    const invalid = 'not-a-valid-url';
    const srcset = createHeroImageSrcset(invalid);
    const entries = srcset.split(', ');
    expect(entries).to.have.length(4);
    entries.forEach((entry) => {
      expect(entry).to.include(invalid);
    });
  });
});

describe('extractInitialImageUrl', () => {
  it('returns the href when the heroImage row contains an anchor', () => {
    const a = document.createElement('a');
    a.href = 'https://rlv.zcache.com/image/123.jpg';
    const block = makeBlock([['heroImage', a]]);
    expect(extractInitialImageUrl(block)).to.equal(a.href);
  });

  it('returns plain text when the heroImage row has no anchor', () => {
    const block = makeBlock([['heroImage', 'https://example.com/image.jpg']]);
    expect(extractInitialImageUrl(block)).to.equal('https://example.com/image.jpg');
  });

  it('returns null when no heroImage row exists', () => {
    const block = makeBlock([['title', 'Some Title'], ['description', 'Some text']]);
    expect(extractInitialImageUrl(block)).to.be.null;
  });

  it('returns null when the heroImage row second cell is empty', () => {
    const block = makeBlock([['heroImage', '']]);
    expect(extractInitialImageUrl(block)).to.be.null;
  });

  it('returns null for a block with no children', () => {
    const block = document.createElement('div');
    expect(extractInitialImageUrl(block)).to.be.null;
  });
});
