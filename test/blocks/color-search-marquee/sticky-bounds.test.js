import { expect } from '@esm-bundle/chai';

import {
  findRelatedColorExploreBlock,
  setupStickyBounds,
} from '../../../express/code/blocks/color-search-marquee/color-search-marquee.js';

class FakeIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.targets = [];
    this.disconnected = false;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target) {
    this.targets.push(target);
  }

  disconnect() {
    this.disconnected = true;
  }

  trigger() {
    const entries = this.targets.map((target) => ({ target, isIntersecting: true }));
    this.callback(entries);
  }
}

FakeIntersectionObserver.instances = [];

describe('color-search-marquee sticky bounds', () => {
  let originalIntersectionObserver;
  let originalGetBoundingClientRect;
  let sentinelTop;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

    FakeIntersectionObserver.instances = [];
    window.IntersectionObserver = FakeIntersectionObserver;

    sentinelTop = 5000;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRectPatched() {
      if (this.dataset?.searchBarEndSentinel === 'true') {
        return {
          top: sentinelTop,
          bottom: sentinelTop + 1,
          left: 0,
          right: 1,
          width: 1,
          height: 1,
          x: 0,
          y: sentinelTop,
          toJSON() { return {}; },
        };
      }

      return originalGetBoundingClientRect.call(this);
    };
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    document.body.innerHTML = '';
  });

  it('finds the nearest following color-explore block', () => {
    document.body.innerHTML = `
      <main>
        <div class="section">
          <div class="color-search-marquee"></div>
        </div>
        <div class="section">
          <div class="banner-bg"></div>
        </div>
        <div class="section">
          <div class="color-explore"></div>
        </div>
      </main>
    `;

    const marqueeBlock = document.querySelector('.color-search-marquee');
    const colorExplore = document.querySelector('.color-explore');
    const result = findRelatedColorExploreBlock(marqueeBlock);
    expect(result).to.equal(colorExplore);
  });

  it('disables sticky after end sentinel threshold and restores when scrolling back', () => {
    document.body.innerHTML = `
      <main>
        <div class="section">
          <div class="color-search-marquee"></div>
        </div>
        <div class="section">
          <div class="color-explore"></div>
        </div>
      </main>
    `;

    const marqueeBlock = document.querySelector('.color-search-marquee');

    let initCalls = 0;
    let destroyCalls = 0;
    let hideSuggestionsCalls = 0;
    const searchBar = {
      initStickyBehavior: () => { initCalls += 1; },
      destroyStickyBehavior: () => { destroyCalls += 1; },
      hideSuggestions: () => { hideSuggestionsCalls += 1; },
    };

    const cleanup = setupStickyBounds(marqueeBlock, searchBar);
    const endSentinel = document.querySelector('[data-search-bar-end-sentinel="true"]');
    expect(endSentinel).to.exist;
    expect(FakeIntersectionObserver.instances).to.have.length(1);
    expect(destroyCalls).to.equal(0);

    sentinelTop = 0;
    FakeIntersectionObserver.instances[0].trigger();
    expect(destroyCalls).to.equal(1);
    expect(hideSuggestionsCalls).to.equal(1);

    sentinelTop = 5000;
    FakeIntersectionObserver.instances[0].trigger();
    expect(initCalls).to.equal(1);

    cleanup();
    expect(document.querySelector('[data-search-bar-end-sentinel="true"]')).to.not.exist;
  });
});
