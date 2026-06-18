import { expect } from '@esm-bundle/chai';
import {
  createHeroImageSrcset,
} from '../../../../express/code/blocks/print-product-detail/utilities/utility-functions.js';

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
