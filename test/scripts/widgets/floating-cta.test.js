import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  delayFloatingCtaUntilMiniEditorPassed,
  delayFloatingCtaUntilViewportPassed,
  makeCTAFromSheet,
  syncFloatingCtaAccessibility,
} from '../../../express/code/scripts/widgets/floating-cta.js';

describe('Floating CTA semantics', () => {
  const data = {
    mainCta: {
      href: 'https://www.adobe.com/express/',
      text: 'Create now',
    },
  };
  let originalLang;

  beforeEach(() => {
    originalLang = document.documentElement.lang;
  });

  afterEach(() => {
    document.documentElement.lang = originalLang;
    document.body.replaceChildren();
    sinon.restore();
  });

  it('keeps link semantics outside French locales', () => {
    document.documentElement.lang = 'en-US';
    const block = document.createElement('div');
    block.innerHTML = '<div></div>';

    const cta = makeCTAFromSheet(block, data);

    expect(cta.tagName).to.equal('A');
    expect(cta.href).to.equal(data.mainCta.href);
  });

  it('uses button semantics for French locales', () => {
    document.documentElement.lang = 'fr-CA';
    const open = sinon.stub(window, 'open');
    const block = document.createElement('div');
    block.innerHTML = '<div></div>';

    const cta = makeCTAFromSheet(block, data);
    cta.click();

    expect(cta.tagName).to.equal('BUTTON');
    expect(cta.dataset.href).to.equal(data.mainCta.href);
    expect(open.calledOnceWith(data.mainCta.href, '_blank', 'noopener,noreferrer')).to.be.true;
  });
});

describe('Floating CTA mini editor delay', () => {
  let originalIntersectionObserver;
  let observerCallback;
  let observedTarget;

  beforeEach(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    observerCallback = undefined;
    observedTarget = undefined;
    window.IntersectionObserver = class MockIntersectionObserver {
      constructor(callback) {
        observerCallback = callback;
        this.observe = (target) => {
          observedTarget = target;
        };
      }
    };
    sinon.stub(window, 'requestAnimationFrame').callsFake((callback) => {
      queueMicrotask(() => callback(performance.now()));
      return 1;
    });
  });

  afterEach(() => {
    sinon.restore();
    window.IntersectionObserver = originalIntersectionObserver;
    document.body.replaceChildren();
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
    expect(button.style.bottom).to.equal('0px');
    expect(restored).to.be.false;

    observerCallback([{ boundingClientRect: { bottom: 0 } }]);
    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.false;
    expect(wrapper.hasAttribute('aria-hidden')).to.be.false;
    expect(wrapper.hasAttribute('inert')).to.be.false;
    expect(restored).to.be.true;
  });

  it('tracks mini editor position when IntersectionObserver is unavailable', async () => {
    window.IntersectionObserver = undefined;
    document.body.innerHTML = `
      <div class="mini-editor"></div>
      <div class="floating-button-wrapper">
        <div class="floating-button"></div>
      </div>`;
    const miniEditor = document.querySelector('.mini-editor');
    const wrapper = document.querySelector('.floating-button-wrapper');
    const button = document.querySelector('.floating-button');
    let miniEditorBottom = 500;
    let restored = false;
    miniEditor.getBoundingClientRect = () => ({ bottom: miniEditorBottom });

    delayFloatingCtaUntilMiniEditorPassed(
      wrapper,
      button,
      miniEditor,
      () => { restored = true; },
    );

    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.true;
    expect(button.style.bottom).to.equal('0px');

    miniEditorBottom = 0;
    window.dispatchEvent(new Event('scroll'));
    await Promise.resolve();

    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.false;
    expect(restored).to.be.true;
  });

  it('does nothing when a mini editor is not authored', () => {
    const wrapper = document.createElement('div');
    const button = document.createElement('div');

    delayFloatingCtaUntilMiniEditorPassed(wrapper, button, null, () => {});

    expect(observedTarget).to.be.undefined;
    expect(wrapper.classList.contains('floating-button--mini-editor-suppressed')).to.be.false;
  });
});

describe('Floating CTA hero delay', () => {
  beforeEach(() => {
    sinon.stub(window, 'requestAnimationFrame').callsFake((callback) => {
      queueMicrotask(() => callback(performance.now()));
      return 1;
    });
  });
  afterEach(() => {
    sinon.restore();
    document.body.replaceChildren();
  });

  it('reveals after the hero fully exits the viewport', async () => {
    document.body.innerHTML = `
      <div class="resume-hero"></div>
      <div class="floating-button-wrapper">
        <div class="floating-button"></div>
      </div>`;
    const hero = document.querySelector('.resume-hero');
    const wrapper = document.querySelector('.floating-button-wrapper');
    const button = document.querySelector('.floating-button');
    let heroBottom = 500;
    let restored = false;
    hero.getBoundingClientRect = () => ({ bottom: heroBottom });

    delayFloatingCtaUntilViewportPassed(
      wrapper,
      button,
      hero,
      () => { restored = true; },
    );

    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.true;
    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;

    heroBottom = 1;
    window.dispatchEvent(new Event('scroll'));
    await Promise.resolve();
    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.true;
    expect(button.style.bottom).to.equal('0px');
    expect(restored).to.be.false;

    heroBottom = 0;
    window.dispatchEvent(new Event('scroll'));
    await Promise.resolve();
    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.false;
    expect(wrapper.hasAttribute('aria-hidden')).to.be.false;
    expect(wrapper.hasAttribute('inert')).to.be.false;
    expect(restored).to.be.true;
  });

  it('stays inaccessible until all suppression states clear', () => {
    const wrapper = document.createElement('div');
    wrapper.classList.add(
      'floating-button--hero-suppressed',
      'floating-button--mini-editor-suppressed',
    );
    syncFloatingCtaAccessibility(wrapper);

    wrapper.classList.remove('floating-button--hero-suppressed');
    syncFloatingCtaAccessibility(wrapper);

    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;

    wrapper.classList.remove('floating-button--mini-editor-suppressed');
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

  it('removes and restores focusability when inert is unavailable', () => {
    const inertDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'inert');
    delete HTMLElement.prototype.inert;
    document.body.innerHTML = `
      <div class="floating-button-wrapper floating-button--suppressed">
        <a href="/express/">Create</a>
        <button tabindex="2">Upload</button>
      </div>`;
    const wrapper = document.querySelector('.floating-button-wrapper');
    const [link, button] = wrapper.querySelectorAll('a, button');

    try {
      syncFloatingCtaAccessibility(wrapper);
      expect(link.getAttribute('tabindex')).to.equal('-1');
      expect(button.getAttribute('tabindex')).to.equal('-1');

      wrapper.classList.remove('floating-button--suppressed');
      syncFloatingCtaAccessibility(wrapper);
      expect(link.hasAttribute('tabindex')).to.be.false;
      expect(button.getAttribute('tabindex')).to.equal('2');
    } finally {
      if (inertDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'inert', inertDescriptor);
      }
    }
  });

  it('does nothing when a hero is not authored', () => {
    const wrapper = document.createElement('div');
    const button = document.createElement('div');

    delayFloatingCtaUntilViewportPassed(wrapper, button, null, () => {});

    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.false;
  });
});
