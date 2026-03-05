/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import {
  getAnalyticsHeaderFromDom,
  getNextLinkIndexInContainer,
} from '../../../../express/code/scripts/utils/analytics.js';

describe('getAnalyticsHeaderFromDom', () => {
  it('returns text from first matching selector', () => {
    const el = document.createElement('div');
    el.innerHTML = '<h2 class="my-title">35 color gradients</h2>';
    expect(getAnalyticsHeaderFromDom(el, { selector: '.my-title' })).to.equal('35 color gradients');
  });

  it('uses fallback when no element found', () => {
    const el = document.createElement('div');
    expect(getAnalyticsHeaderFromDom(el, { selector: '.missing', fallback: 'Gallery' })).to.equal('Gallery');
  });

  it('uses default fallback Section when options not provided and empty', () => {
    const el = document.createElement('div');
    expect(getAnalyticsHeaderFromDom(el)).to.equal('Section');
  });

  it('sanitizes and truncates to 20 chars', () => {
    const el = document.createElement('div');
    el.innerHTML = '<h1>Hello! @world — 123</h1>';
    expect(getAnalyticsHeaderFromDom(el, { selector: 'h1' })).to.equal('Hello world  123');
  });

  it('returns fallback when container is null or not an element', () => {
    expect(getAnalyticsHeaderFromDom(null, { fallback: 'X' })).to.equal('X');
    expect(getAnalyticsHeaderFromDom({}, { fallback: 'Y' })).to.equal('Y');
  });
});

describe('getNextLinkIndexInContainer', () => {
  it('returns count + 1 for links and buttons', () => {
    const el = document.createElement('div');
    el.innerHTML = '<a href="#">One</a><button>Two</button><a href="#x">Three</a>';
    expect(getNextLinkIndexInContainer(el)).to.equal(4);
  });

  it('returns 1 when container is empty', () => {
    const el = document.createElement('div');
    expect(getNextLinkIndexInContainer(el)).to.equal(1);
  });

  it('returns 1 when container is null or not an element', () => {
    expect(getNextLinkIndexInContainer(null)).to.equal(1);
    expect(getNextLinkIndexInContainer({})).to.equal(1);
  });

  it('accepts custom selector', () => {
    const el = document.createElement('div');
    el.innerHTML = '<span class="card">A</span><span class="card">B</span>';
    expect(getNextLinkIndexInContainer(el, { selector: '.card' })).to.equal(3);
  });
});
