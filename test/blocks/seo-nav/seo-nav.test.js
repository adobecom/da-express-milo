/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

await import('../../../express/code/scripts/scripts.js');
const { default: decorate, updatePillsByCKG } = await import(
  '../../../express/code/blocks/seo-nav/seo-nav.js'
);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Seo Nav', () => {
  it('Seo Nav exists', () => {
    const seoNav = document.querySelector('.seo-nav');
    decorate(seoNav);
    expect(seoNav).to.exist;
  });

  it('Seo Nav has correct elements', () => {
    const seoNav = document.querySelector('.seo-nav');
    decorate(seoNav);

    const a = seoNav.querySelectorAll('a.button');
    expect(a).to.exist;
  });

  it('If mutation contains childList and has carousel container, upDatePillsByCKG should be disconnected', () => {
    const seoNav = document.querySelector('.seo-nav');
    const carouselDiv = seoNav.querySelector('div:nth-of-type(2) > div');

    const observerCallback = updatePillsByCKG(seoNav, carouselDiv);
    const mutationList = [{ type: 'childList' }];
    const observer = { disconnect: () => {} };
    observerCallback(mutationList, observer);
  });

  it('Carousel Div should have display none if there are no links ', () => {
    const seoNav = document.querySelector('.seo-nav');
    const carouselDiv = seoNav.querySelector('div:nth-of-type(2) > div');

    const observerCallback = updatePillsByCKG(
      { querySelectorAll: () => [] },
      { querySelector: () => null, style: { display: 'none' } },
    );
    const mutationList = [{ type: 'childList' }];
    const observer = { disconnect: () => {} };
    observerCallback(mutationList, observer);
  });
});
