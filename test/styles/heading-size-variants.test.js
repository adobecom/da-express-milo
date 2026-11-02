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
  ['heading-xxxxl', 48, 73, 82],
  ['heading-xxxl', 40, 52, 58],
  ['heading-xxl', 32, 44, 52],
  ['heading-xl', 28, 36, 40],
  ['heading-l', 24, 28, 32],
  ['heading-m', 20, 24, 28],
  ['heading-s', 18, 20, 22],
  ['heading-xs', 16, 18, 20],
  ['heading-xxs', 14, 14, 14],
];

const c2Variants = [
  ['heading-super', 48, 73, 82],
  ['heading-1', 40, 52, 58],
  ['heading-2', 32, 44, 52],
  ['heading-3', 28, 36, 40],
  ['heading-4', 24, 28, 32],
  ['heading-5', 20, 24, 28],
  ['heading-6', 18, 20, 22],
];

function renderVariants(variants) {
  document.body.innerHTML = `<main>${variants.map(([variant]) => `
    <div class="test-block ${variant}">
      <h2 data-variant="${variant}">${variant}</h2>
    </div>`).join('')}
  </main>`;
}

function expectSizes(variants, expectedIndex) {
  variants.forEach(([variant, ...sizes]) => {
    const heading = document.querySelector(`[data-variant="${variant}"]`);
    expect(getComputedStyle(heading).fontSize, variant).to.equal(`${sizes[expectedIndex]}px`);
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

  it('applies to direct and dynamically-created headings without affecting body copy', async () => {
    await setViewport({ width: 375, height: 800 });
    document.body.innerHTML = `
      <main>
        <div class="test-block ax-heading-l">
          <p>Body copy</p>
        </div>
        <h3 class="ax-heading-xxl">Direct heading</h3>
      </main>`;

    const block = document.querySelector('.test-block');
    const heading = document.createElement('h4');
    block.append(heading);

    expect(getComputedStyle(heading).fontSize).to.equal('24px');
    expect(getComputedStyle(document.querySelector('.ax-heading-xxl')).fontSize).to.equal('32px');
    expect(getComputedStyle(block.querySelector('p')).fontSize).to.equal('17px');
  });
});
