import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  setSusiColorRedirect,
  consumeSusiColorRedirect,
  buildColorSignInRedirectUrl,
} from '../../../../express/code/scripts/color-shared/utils/susiRedirect.js';

let savedHref;

beforeEach(() => {
  savedHref = window.location.href;
});

afterEach(() => {
  consumeSusiColorRedirect(); // drain any leftover stored redirect
  sinon.restore();
  document.body.innerHTML = '';
  window.history.replaceState({}, '', savedHref);
});

describe('setSusiColorRedirect', () => {
  it('stores the URL, readable via consumeSusiColorRedirect', () => {
    setSusiColorRedirect('https://example.com/redirect');
    expect(consumeSusiColorRedirect()).to.equal('https://example.com/redirect');
  });

  it('overwrites a previously stored URL', () => {
    setSusiColorRedirect('https://example.com/first');
    setSusiColorRedirect('https://example.com/second');
    expect(consumeSusiColorRedirect()).to.equal('https://example.com/second');
  });
});

describe('consumeSusiColorRedirect', () => {
  it('returns the stored URL', () => {
    setSusiColorRedirect('https://example.com/redirect');
    const result = consumeSusiColorRedirect();
    expect(result).to.equal('https://example.com/redirect');
  });

  it('clears the stored URL after consuming (second call returns null)', () => {
    setSusiColorRedirect('https://example.com/redirect');
    consumeSusiColorRedirect();
    expect(consumeSusiColorRedirect()).to.be.null;
  });

  it('returns null when nothing is stored', () => {
    const result = consumeSusiColorRedirect();
    expect(result).to.be.null;
  });

  it('returns null on a second call (one-time consumption)', () => {
    setSusiColorRedirect('https://example.com/redirect');
    consumeSusiColorRedirect();
    const second = consumeSusiColorRedirect();
    expect(second).to.be.null;
  });
});

describe('buildColorSignInRedirectUrl', () => {
  const colors = ['#FF0000', '#00FF00', '#0000FF'];
  const name = 'My Palette';

  it('returns a URL string', () => {
    const result = buildColorSignInRedirectUrl(colors, name);
    expect(result).to.be.a('string');
    expect(() => new URL(result)).to.not.throw();
  });

  it('encodes color palette in the URL', () => {
    const result = buildColorSignInRedirectUrl(colors, name);
    const url = new URL(result);
    const param = url.searchParams.get('color-palette');
    expect(param).to.include('FF0000');
  });

  it('uses current page URL when not on color-explore', () => {
    window.history.replaceState({}, '', '/create/color-wheel');

    const result = buildColorSignInRedirectUrl(colors, name);
    const url = new URL(result);
    expect(url.pathname).to.equal('/create/color-wheel');
  });

  it('returns current URL when on color-explore page', () => {
    const el = document.createElement('div');
    el.className = 'color-explore';
    document.body.appendChild(el);

    window.history.replaceState({}, '', '/color-explore');

    const result = buildColorSignInRedirectUrl(colors, name);
    const url = new URL(result);
    expect(url.pathname).to.equal('/color-explore');
  });

  it('uses current page URL for color-extract', () => {
    const el = document.createElement('div');
    el.className = 'color-extract';
    document.body.appendChild(el);

    window.history.replaceState({}, '', '/create/image');

    const result = buildColorSignInRedirectUrl(colors, name);
    const url = new URL(result);
    expect(url.pathname).to.equal('/create/image');
  });

  it('preserves locale prefix when returning current URL on color-explore page', () => {
    const el = document.createElement('div');
    el.className = 'color-explore';
    document.body.appendChild(el);

    window.history.replaceState({}, '', '/cn/color-explore');

    const result = buildColorSignInRedirectUrl(colors, name);
    const url = new URL(result);
    expect(url.pathname).to.equal('/cn/color-explore');
  });

  it('no locale prefix for default (English) locale on color-explore redirect', () => {
    const el = document.createElement('div');
    el.className = 'color-explore';
    document.body.appendChild(el);

    window.history.replaceState({}, '', '/create/color-wheel');

    const result = buildColorSignInRedirectUrl(colors, name);
    const url = new URL(result);
    expect(url.pathname).to.equal('/create/color-wheel');
    expect(url.pathname).to.not.match(/^\/[a-z]{2,3}\//);
  });
});
