/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import createHarmonyModalContent from '../../../express/code/blocks/color-wheel/createHarmonyModal.js';

const RULES = [
  {
    value: 'CUSTOM',
    label: 'Custom',
    description: 'Random colors.',
    imageSrc: '/express/code/blocks/color-wheel/harmony-thumbnails/custom.png',
    previewColors: ['#1900AB', '#6BB1FF', '#FF7500', '#FFFDEB', '#0076FF'],
  },
  {
    value: 'ANALOGOUS',
    label: 'Analogous',
    description: 'Neighboring colors.',
    imageSrc: '/express/code/blocks/color-wheel/harmony-thumbnails/analogous.png',
    previewColors: ['#1900AB', '#DB8B69', '#FFA000', '#FF1F02', '#FFBE00'],
  },
  {
    value: 'TRIAD',
    label: 'Triad',
    description: 'Evenly spaced colors.',
    imageSrc: '/express/code/blocks/color-wheel/harmony-thumbnails/triad.png',
    previewColors: ['#1900AB', '#3C00FF', '#00FF0E', '#AA6E39', '#4F4080'],
  },
];

describe('color harmony modal content', () => {
  let view;
  let confirmed;
  let style;

  before(async () => {
    style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = '/express/code/blocks/color-wheel/color-wheel.css';
    await new Promise((resolve, reject) => {
      style.onload = resolve;
      style.onerror = reject;
      document.head.appendChild(style);
    });
  });

  beforeEach(() => {
    confirmed = [];
    view = createHarmonyModalContent({
      rules: RULES,
      selectedValue: 'ANALOGOUS',
      paletteColors: ['#112233', '#445566', '#778899', '#AABBCC', '#DDEEFF'],
      strings: { title: 'Learn about color harmonies', confirm: 'Apply Harmony' },
      onConfirm: (value) => confirmed.push(value),
    });
    document.body.appendChild(view.element);
  });

  afterEach(async () => {
    view.element.remove();
    await setViewport({ width: 800, height: 600 });
  });

  after(() => style.remove());

  it('renders one selectable card per supplied harmony', () => {
    const cards = [...view.element.querySelectorAll('[role="radio"]')];
    expect(cards).to.have.length(RULES.length);
    expect(cards.map((card) => card.dataset.harmonyValue)).to.deep.equal(
      RULES.map((rule) => rule.value),
    );
    expect(cards[1].getAttribute('aria-checked')).to.equal('true');
    expect(cards[1].tabIndex).to.equal(0);
    expect(cards.every((card) => card.tabIndex === 0)).to.equal(true);
    expect(view.element.querySelectorAll('.color-harmony-card-palette-swatch')).to.have.length(15);
    const configuredPalette = view.element.querySelector('.color-harmony-modal-palette-strip .ax-swatch-strip');
    expect(configuredPalette).to.exist;
    expect(configuredPalette.querySelectorAll('.ax-swatch')).to.have.length(5);
    expect(configuredPalette.getAttribute('aria-label')).to.equal('5 colors in palette');
    expect(view.element.querySelector('.color-harmony-modal-summary-palette')).to.not.exist;
    const footerContent = view.element.querySelector('.color-harmony-modal-footer-content');
    expect(footerContent.contains(view.element.querySelector('.color-harmony-modal-summary'))).to.equal(true);
    expect(footerContent.contains(view.element.querySelector('.color-harmony-modal-confirm'))).to.equal(true);
    expect(view.element.querySelector('.color-harmony-modal-confirm').textContent).to.equal('Apply Harmony');
  });

  it('previews a card selection and applies it only on confirmation', () => {
    const triad = view.element.querySelector('[data-harmony-value="TRIAD"]');
    triad.click();

    expect(view.getSelectedValue()).to.equal('TRIAD');
    expect(triad.getAttribute('aria-checked')).to.equal('true');
    expect(confirmed).to.deep.equal([]);
    expect(view.element.querySelector('.color-harmony-modal-summary-name').textContent).to.equal('Triad');
    const configuredPalette = view.element.querySelector('.color-harmony-modal-palette-strip .ax-swatch-strip');
    const previewColors = [...configuredPalette.querySelectorAll('.ax-swatch')]
      .map((swatch) => swatch.style.backgroundColor);
    expect(previewColors).to.deep.equal([
      'rgb(25, 0, 171)',
      'rgb(60, 0, 255)',
      'rgb(0, 255, 14)',
      'rgb(170, 110, 57)',
      'rgb(79, 64, 128)',
    ]);

    view.element.querySelector('.color-harmony-modal-confirm').click();
    expect(confirmed).to.deep.equal(['TRIAD']);
  });

  it('supports arrow, Home, and End navigation with announced selection state', () => {
    const analogous = view.element.querySelector('[data-harmony-value="ANALOGOUS"]');
    analogous.focus();
    analogous.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    const triad = view.element.querySelector('[data-harmony-value="TRIAD"]');
    expect(document.activeElement).to.equal(triad);
    expect(triad.getAttribute('aria-checked')).to.equal('true');

    triad.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    const custom = view.element.querySelector('[data-harmony-value="CUSTOM"]');
    expect(document.activeElement).to.equal(custom);
    expect(custom.getAttribute('aria-checked')).to.equal('true');

    custom.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).to.equal(triad);
  });

  it('uses one card column on mobile and two on larger screens', async () => {
    const grid = view.element.querySelector('.color-harmony-modal-cards');
    await setViewport({ width: 375, height: 800 });
    expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).to.have.length(1);

    await setViewport({ width: 1024, height: 800 });
    expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).to.have.length(2);
  });
});
