import { expect } from '@esm-bundle/chai';
import {
  delayFloatingCtaUntilMiniEditorPassed,
  syncFloatingCtaAccessibility,
} from '../../../express/code/scripts/widgets/floating-cta.js';

describe('Floating CTA mini editor delay', () => {
  let originalIntersectionObserver;
  let observerCallback;
  let observedTarget;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    observerCallback = undefined;
    observedTarget = undefined;
    window.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback, options) {
        observerCallback = callback;
        this.options = options;
        this.observe = (target) => {
          observedTarget = target;
        };
      }
    };
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    document.body.innerHTML = '';
  });

  it('stays hidden until the entire mini editor has scrolled above the viewport', () => {
    document.body.innerHTML = `
      <div class="mini-editor"></div>
      <div class="floating-button-wrapper">
        <div class="floating-button"></div>
      </div>`;
    const miniEditor = document.querySelector('.mini-editor');
    const wrapper = document.querySelector('.floating-button-wrapper');
    const button = document.querySelector('.floating-button');
    let restored = false;

    delayFloatingCtaUntilMiniEditorPassed(
      wrapper,
      button,
      miniEditor,
      () => { restored = true; },
    );

    expect(observedTarget).to.equal(miniEditor);
    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.true;
    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;

    observerCallback([{ boundingClientRect: { bottom: 500 } }]);
    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.true;
    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;
    expect(button.style.bottom).to.equal('0px');
    expect(restored).to.be.false;

    observerCallback([{ boundingClientRect: { bottom: 0 } }]);
    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.false;
    expect(wrapper.hasAttribute('aria-hidden')).to.be.false;
    expect(wrapper.hasAttribute('inert')).to.be.false;
    expect(restored).to.be.true;
  });

  it('stays inaccessible while another suppression state remains active', () => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('floating-button--mini-editor-suppressed', 'floating-button--hidden');
    syncFloatingCtaAccessibility(wrapper);

    wrapper.classList.remove('floating-button--mini-editor-suppressed');
    syncFloatingCtaAccessibility(wrapper);

    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;

    wrapper.classList.remove('floating-button--hidden');
    syncFloatingCtaAccessibility(wrapper);

    expect(wrapper.hasAttribute('aria-hidden')).to.be.false;
    expect(wrapper.hasAttribute('inert')).to.be.false;
  });

  it('makes the existing suppression state inaccessible', () => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('floating-button--suppressed');

    syncFloatingCtaAccessibility(wrapper);

    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;
  });

  it('does nothing when a mini editor is not authored', () => {
    const wrapper = document.createElement('div');
    const button = document.createElement('div');

    delayFloatingCtaUntilMiniEditorPassed(wrapper, button, null, () => {});

    expect(observedTarget).to.be.undefined;
    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.false;
  });
});
