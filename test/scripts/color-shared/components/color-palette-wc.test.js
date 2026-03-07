/* eslint-disable max-len */
import { expect } from '@esm-bundle/chai';
import '../../../../express/code/libs/color-components/components/color-palette/index.js';

const mockPalette = {
  name: 'Test',
  colors: ['#ff0000', '#00ff00'],
};

describe('color-palette WC (focusable)', () => {
  let el;

  beforeEach(() => {
    el = document.createElement('color-palette');
    el.palette = mockPalette;
  });

  afterEach(() => {
    el?.remove();
  });

  it('when focusable is true (default), wrapper has tabindex="0"', async () => {
    el.focusable = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const wrapper = el.shadowRoot.querySelector('.custom-outline');
    expect(wrapper).to.exist;
    expect(wrapper.getAttribute('tabindex')).to.equal('0');
  });

  it('when focusable is false, wrapper has tabindex="-1"', async () => {
    el.setAttribute('focusable', 'false');
    document.body.appendChild(el);
    await el.updateComplete;
    const wrapper = el.shadowRoot.querySelector('.custom-outline');
    expect(wrapper).to.exist;
    expect(wrapper.getAttribute('tabindex')).to.equal('-1');
  });

  it('when focusable is false, pills have role="presentation" and tabindex="-1"', async () => {
    el.setAttribute('focusable', 'false');
    document.body.appendChild(el);
    await el.updateComplete;
    const pills = el.shadowRoot.querySelectorAll('.palette');
    expect(pills.length).to.equal(2);
    pills.forEach((pill) => {
      expect(pill.getAttribute('role')).to.equal('presentation');
      expect(pill.getAttribute('tabindex')).to.equal('-1');
    });
  });

  it('when focusable is true, pills have role="button" and tabindex', async () => {
    el.focusable = true;
    document.body.appendChild(el);
    await el.updateComplete;
    const pills = el.shadowRoot.querySelectorAll('.palette');
    expect(pills.length).to.equal(2);
    pills.forEach((pill) => {
      expect(pill.getAttribute('role')).to.equal('button');
    });
  });
});
