import { expect } from '@esm-bundle/chai';
import {
  createHeroImageSrcset,
  extractInitialImageUrl,
  getPdpClickTarget,
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

  it('returns null for a javascript: URL', () => {
    const proto = 'javascript';
    const block = makeBlock([['heroImage', `${proto}:alert(1)`]]);
    expect(extractInitialImageUrl(block)).to.be.null;
  });

  it('returns null for a data: URL', () => {
    const block = makeBlock([['heroImage', 'data:text/html,<script>alert(1)</script>']]);
    expect(extractInitialImageUrl(block)).to.be.null;
  });

  it('returns null for an unparseable URL string', () => {
    const block = makeBlock([['heroImage', 'not a url']]);
    expect(extractInitialImageUrl(block)).to.be.null;
  });
});

describe('getPdpClickTarget', () => {
  function render(markup) {
    const container = document.createElement('div');
    container.innerHTML = markup;
    return container;
  }

  it('maps the Customize and print CTA, including clicks on its children', () => {
    const container = render('<a class="pdpx-checkout-button" href="https://express.example.com/edit"><span>CTA</span></a>');
    expect(getPdpClickTarget(container.querySelector('span'))).to.deep.equal({
      linkName: 'customize-and-print',
      linkUrl: 'https://express.example.com/edit',
    });
  });

  it('maps option selections and drawer controls', () => {
    const container = render(`
      <button class="pdpx-pill-container" role="radio"></button>
      <input type="radio" name="size" />
      <div class="pdpx-drawer-head"><button type="button"></button></div>
      <button class="pdpx-drawer-foot-select-button"></button>
    `);
    expect(getPdpClickTarget(container.querySelector('.pdpx-pill-container')).linkName).to.equal('option-select');
    expect(getPdpClickTarget(container.querySelector('input')).linkName).to.equal('option-select');
    expect(getPdpClickTarget(container.querySelector('.pdpx-drawer-head button')).linkName).to.equal('drawer-close');
    expect(getPdpClickTarget(container.querySelector('.pdpx-drawer-foot-select-button')).linkName).to.equal('drawer-select');
  });

  it('falls back to "other" for unmapped interactive elements', () => {
    const container = render('<button class="something-new"></button>');
    expect(getPdpClickTarget(container.querySelector('button'))).to.deep.equal({
      linkName: 'other',
      linkUrl: undefined,
    });
  });

  it('returns null for non-interactive targets', () => {
    const container = render('<p><span>text</span></p>');
    expect(getPdpClickTarget(container.querySelector('span'))).to.equal(null);
  });
});
