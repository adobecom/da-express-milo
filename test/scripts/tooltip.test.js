import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../express/code/scripts/utils.js';

import handleTooltip, { isSpotlightBusinessPage } from '../../express/code/scripts/widgets/tooltip.js';

setLibs('/libs');

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

describe('Tooltip aria-label on Spotlight Business', () => {
  const message = 'If you cancel after 14 days, your payment is non-refundable, and your service will continue until the end of your contracted term.';
  let originalBodyHTML;
  let originalPath;

  const render = async () => {
    document.body.innerHTML = `<main><section><p>Teams [[tooltip]]  ${message}  [[/tooltip]]</p></section></main>`;
    await handleTooltip(document.querySelectorAll('p'), TOOLTIP_PATTERN);
    return document.querySelector('.tooltip');
  };

  beforeEach(() => {
    originalBodyHTML = document.body.innerHTML;
    originalPath = window.location.pathname;
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalPath);
    document.body.innerHTML = originalBodyHTML;
  });

  it('prefixes and trims the label on Spotlight Business', async () => {
    window.history.replaceState(null, '', '/express/spotlight/business');
    const container = await render();
    const button = container.querySelector('button');
    expect(button.getAttribute('aria-label')).to.equal(`Tooltip: ${message}`);
    expect(container.querySelector('.tooltip-text').textContent.trim()).to.equal(message);
  });

  it('keeps the label unchanged on other pages', async () => {
    window.history.replaceState(null, '', '/express/pricing');
    const container = await render();
    const label = container.querySelector('button').getAttribute('aria-label');
    expect(label).to.contain(message);
    expect(label).to.not.contain('Tooltip');
  });

  it('matches only the Spotlight Business path', () => {
    expect(isSpotlightBusinessPage('/express/spotlight/business')).to.be.true;
    expect(isSpotlightBusinessPage('/express/spotlight/business/')).to.be.true;
    expect(isSpotlightBusinessPage('/express/spotlight/business.html')).to.be.true;
    expect(isSpotlightBusinessPage('/express/spotlight/education')).to.be.false;
    expect(isSpotlightBusinessPage('/express/pricing')).to.be.false;
    expect(isSpotlightBusinessPage('/express/business')).to.be.false;
  });
});
