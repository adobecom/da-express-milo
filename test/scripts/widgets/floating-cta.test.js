import { expect } from '@esm-bundle/chai';
import {
  delayFloatingCtaUntilViewportPassed,
  syncFloatingCtaAccessibility,
} from '../../../express/code/scripts/widgets/floating-cta.js';

describe('Floating CTA hero delay', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reveals after scrolling one viewport past the hero start', async () => {
    document.body.innerHTML = `
      <div class="resume-hero"></div>
      <div class="floating-button-wrapper">
        <div class="floating-button"></div>
      </div>`;
    const hero = document.querySelector('.resume-hero');
    const wrapper = document.querySelector('.floating-button-wrapper');
    const button = document.querySelector('.floating-button');
    let heroTop = 0;
    let restored = false;
    hero.getBoundingClientRect = () => ({ top: heroTop });

    delayFloatingCtaUntilViewportPassed(
      wrapper,
      button,
      hero,
      () => { restored = true; },
    );

    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.true;
    expect(wrapper.getAttribute('aria-hidden')).to.equal('true');
    expect(wrapper.hasAttribute('inert')).to.be.true;

    heroTop = -(window.innerHeight - 1);
    window.dispatchEvent(new Event('scroll'));
    await new Promise(requestAnimationFrame);
    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.true;
    expect(button.style.bottom).to.equal('0px');
    expect(restored).to.be.false;

    heroTop = -window.innerHeight;
    window.dispatchEvent(new Event('scroll'));
    await new Promise(requestAnimationFrame);
    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.false;
    expect(wrapper.hasAttribute('aria-hidden')).to.be.false;
    expect(wrapper.hasAttribute('inert')).to.be.false;
    expect(restored).to.be.true;
  });

  it('stays inaccessible while another suppression state remains active', () => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('floating-button--hero-suppressed', 'floating-button--hidden');
    syncFloatingCtaAccessibility(wrapper);

    wrapper.classList.remove('floating-button--hero-suppressed');
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

  it('does nothing when a hero is not authored', () => {
    const wrapper = document.createElement('div');
    const button = document.createElement('div');

    delayFloatingCtaUntilViewportPassed(wrapper, button, null, () => {});

    expect(wrapper.classList.contains('floating-button--hero-suppressed')).to.be.false;
  });
});
