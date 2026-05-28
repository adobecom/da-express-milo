/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { saveImageSrc } from '../../../express/code/blocks/color-wheel/createImageExtractComponent.js';

const STORAGE_KEY = 'color-wheel-image-src';

describe('saveImageSrc', () => {
  afterEach(() => {
    sinon.restore(); // restore stubs before touching storage
    sessionStorage.removeItem(STORAGE_KEY);
  });

  it('stores the src in sessionStorage', () => {
    saveImageSrc('https://example.com/image.jpg');
    expect(sessionStorage.getItem(STORAGE_KEY)).to.equal('https://example.com/image.jpg');
  });

  it('overwrites a previously stored value with the new src', () => {
    sessionStorage.setItem(STORAGE_KEY, 'old-value');
    saveImageSrc('new-value');
    expect(sessionStorage.getItem(STORAGE_KEY)).to.equal('new-value');
  });

  it('clears a stale entry when the write fails (quota exceeded)', () => {
    sessionStorage.setItem(STORAGE_KEY, 'stale-suggestion-url');
    sinon.stub(Storage.prototype, 'setItem').throws(new DOMException('QuotaExceededError'));
    saveImageSrc('data:image/png;base64,verylarge');
    expect(sessionStorage.getItem(STORAGE_KEY)).to.be.null;
  });

  it('does not throw when both setItem and removeItem fail', () => {
    sinon.stub(Storage.prototype, 'setItem').throws(new DOMException('QuotaExceededError'));
    sinon.stub(Storage.prototype, 'removeItem').throws(new Error('storage error'));
    expect(() => saveImageSrc('data:image/png;base64,test')).to.not.throw();
  });
});
