import { expect } from '@esm-bundle/chai';

import handleTooltip from '../../express/code/scripts/widgets/tooltip.js';

// Initialize libs/config similar to pricing tests so dynamic imports in handleTooltip work
const imports = await Promise.all([
  import('../../express/code/scripts/utils.js'),
  import('../../express/code/scripts/scripts.js'),
]);
const [{ getLibs }] = imports;

// Configure locales to satisfy getConfig() calls from libs utils
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } } };
  mod.setConfig(conf);
});

// Match pricing-cards tooltip token pattern: [[tooltip]]...[[/tooltip]]
const TOOLTIP_PATTERN = /\[\[([^]+)\]\]([^]+)\[\[\/([^]+)\]\]/g;

describe('Tooltip widget parsing', () => {
  let originalBodyHTML;

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = originalBodyHTML;
  });

  it('renders tooltip and removes token from the page', async () => {
    const tooltipContent = 'If you cancel more than 14 days after your paid subscription begins, your payment is non-refundable, and your service will continue until the end of that month’s billing period.';
    document.body.innerHTML = `
      <main>
        <section>
          <p>
            No annual commitment, billed monthly. Cancel anytime1, no fee.
            [[tooltip]]${tooltipContent} [[/tooltip]]
          </p>
        </section>
      </main>
    `;

    const paragraphs = document.querySelectorAll('p');
    await handleTooltip(paragraphs, TOOLTIP_PATTERN);

    // Token markers should be removed from the page
    expect(document.body.textContent).to.not.include('[[tooltip]]');
    expect(document.body.textContent).to.not.include('[[/tooltip]]');

    // Tooltip DOM should be constructed
    const tooltipContainer = document.querySelector('.tooltip');
    expect(tooltipContainer).to.exist;
    const button = tooltipContainer.querySelector('button');
    const popup = tooltipContainer.querySelector('.tooltip-text');
    expect(button).to.exist;
    expect(popup).to.exist;
    expect(popup.textContent.trim()).to.equal(tooltipContent.trim());
    expect(button.getAttribute('aria-label').trim()).to.equal(tooltipContent.trim());
  });
});
