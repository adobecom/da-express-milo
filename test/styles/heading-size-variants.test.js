/* eslint-env mocha */

import { setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = '/express/code/styles/styles.css';
await new Promise((resolve, reject) => {
  stylesheet.addEventListener('load', resolve, { once: true });
  stylesheet.addEventListener('error', reject, { once: true });
  document.head.append(stylesheet);
});

const competingStyles = document.createElement('style');
competingStyles.textContent = `
  .test-block h2 {
    font-size: 99px;
    line-height: 99px;
  }

  .test-block p {
    font-size: 17px;
  }
`;
document.head.append(competingStyles);

const legacyVariants = [
  ['xxxxl-heading', 1.1, 48, 73, 82],
  ['xxxl-heading', 1.1, 40, 52, 58],
  ['xxl-heading', 1.1, 32, 44, 52],
  ['xl-heading', 1.1, 28, 36, 40],
  ['l-heading', 1.1, 24, 28, 32],
  ['m-heading', 1.15, 20, 24, 28],
  ['s-heading', 1.15, 18, 20, 22],
  ['xs-heading', 1.15, 16, 18, 20],
  ['xxs-heading', 1.15, 14, 14, 14],
];

const c2Variants = [
  ['heading-super', 1.1, 48, 73, 82],
  ['heading-1', 1.1, 40, 52, 58],
  ['heading-2', 1.1, 32, 44, 52],
  ['heading-3', 1.1, 28, 36, 40],
  ['heading-4', 1.1, 24, 28, 32],
  ['heading-5', 1.15, 20, 24, 28],
  ['heading-6', 1.15, 18, 20, 22],
];

function renderVariants(variants) {
  document.body.innerHTML = `<main>${variants.map(([variant]) => `
    <div class="test-block ${variant}">
      <h2 data-variant="${variant}">${variant}</h2>
    </div>`).join('')}
  </main>`;
}

function expectSizes(variants, expectedIndex) {
  variants.forEach(([variant, lineHeightRatio, ...sizes]) => {
    const heading = document.querySelector(`[data-variant="${variant}"]`);
    const styles = getComputedStyle(heading);
    expect(styles.fontSize, variant).to.equal(`${sizes[expectedIndex]}px`);
    expect(parseFloat(styles.lineHeight), variant)
      .to.be.closeTo(sizes[expectedIndex] * lineHeightRatio, 0.01);
  });
}

describe('Universal heading size variants', () => {
  afterEach(async () => {
    document.body.innerHTML = '';
    await setViewport({ width: 800, height: 600 });
  });

  it('overrides block heading sizes with legacy authoring variants at every breakpoint', async () => {
    renderVariants(legacyVariants);

    await setViewport({ width: 375, height: 800 });
    expectSizes(legacyVariants, 0);

    await setViewport({ width: 1200, height: 800 });
    expectSizes(legacyVariants, 1);

    await setViewport({ width: 1680, height: 900 });
    expectSizes(legacyVariants, 2);
  });

  it('supports Consonant 2 authoring aliases with Express sizes', async () => {
    renderVariants(c2Variants);

    await setViewport({ width: 375, height: 800 });
    expectSizes(c2Variants, 0);

    await setViewport({ width: 1200, height: 800 });
    expectSizes(c2Variants, 1);

    await setViewport({ width: 1680, height: 900 });
    expectSizes(c2Variants, 2);
  });

  it('preserves existing AX heading tokens for unrelated consumers', async () => {
    await setViewport({ width: 375, height: 800 });
    expect(getComputedStyle(document.documentElement).getPropertyValue('--ax-heading-xxl-size').trim())
      .to.equal('36px');
    expect(getComputedStyle(document.documentElement).getPropertyValue('--ax-heading-xl-lh').trim())
      .to.equal('35px');

    await setViewport({ width: 1200, height: 800 });
    expect(getComputedStyle(document.documentElement).getPropertyValue('--ax-heading-xxl-size').trim())
      .to.equal('44px');
    expect(getComputedStyle(document.documentElement).getPropertyValue('--ax-heading-xl-lh').trim())
      .to.equal('45px');

    await setViewport({ width: 1680, height: 900 });
    expect(getComputedStyle(document.documentElement).getPropertyValue('--ax-heading-xxl-size').trim())
      .to.equal('44px');
    expect(getComputedStyle(document.documentElement).getPropertyValue('--ax-heading-xl-lh').trim())
      .to.equal('45px');
  });

  it('applies to direct and dynamically-created headings without affecting body copy', async () => {
    await setViewport({ width: 375, height: 800 });
    document.body.innerHTML = `
      <main>
        <div class="test-block ax-heading-l">
          <p>Body copy</p>
          <span data-body-copy>Body copy span</span>
        </div>
        <span data-body-control>Body control span</span>
        <h3 class="ax-heading-xxl">Direct AX heading</h3>
        <h3 class="heading-xl">Direct Milo heading</h3>
      </main>`;

    const block = document.querySelector('.test-block');
    const heading = document.createElement('h4');
    block.append(heading);

    expect(getComputedStyle(heading).fontSize).to.equal('24px');
    expect(getComputedStyle(document.querySelector('.ax-heading-xxl')).fontSize).to.equal('32px');
    expect(getComputedStyle(document.querySelector('.heading-xl')).fontSize).to.equal('28px');
    expect(getComputedStyle(block.querySelector('p')).fontSize).to.equal('17px');
    expect(getComputedStyle(block.querySelector('p')).fontWeight).to.equal('400');

    const bodyCopyStyles = getComputedStyle(document.querySelector('[data-body-copy]'));
    const bodyControlStyles = getComputedStyle(document.querySelector('[data-body-control]'));
    ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily'].forEach((property) => {
      expect(bodyCopyStyles[property], property).to.equal(bodyControlStyles[property]);
    });
  });
});
