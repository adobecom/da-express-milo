import { expect } from '@esm-bundle/chai';
import { getContentToggleScrollTop } from '../../../express/code/blocks/content-toggle/content-toggle.js';

describe('Content Toggle scroll position', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--express-fixed-top-height');
    document.documentElement.style.removeProperty('--spacing-200');
    document.body.innerHTML = '';
  });

  it('keeps content spacing below the complete fixed navigation stack', () => {
    document.documentElement.style.setProperty('--express-fixed-top-height', '112px');
    document.documentElement.style.setProperty('--spacing-200', '16px');
    const block = document.createElement('div');
    block.getBoundingClientRect = () => ({ top: 240 });
    document.body.append(block);

    expect(getContentToggleScrollTop(block, 0)).to.equal(112);
  });
});
