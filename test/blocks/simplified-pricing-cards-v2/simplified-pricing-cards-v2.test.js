/* eslint-env mocha */
import { readFile, setViewport, sendKeys } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitFor } from '../../helpers/waitfor.js';

window.isTestEnv = true;

await import('../../../express/code/scripts/scripts.js');
const { setLibs } = await import('../../../express/code/scripts/utils.js');
setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
const { default: decorate } = await import('../../../express/code/blocks/simplified-pricing-cards-v2/simplified-pricing-cards-v2.js');

const body = await readFile({ path: './mocks/body.html' });

const mounted = [];

async function mount(selector = '.simplified-pricing-cards-v2') {
  document.body.innerHTML = body;
  const block = document.querySelector(selector);
  mounted.push(block);
  await decorate(block);
  return block;
}

const buttonsIn = (block) => block.querySelectorAll('.card-header button, .card-header [role="button"]');

describe('simplified-pricing-cards-v2 header semantics', () => {
  beforeEach(() => {
    sinon.stub(window, 'fetch').resolves(new Response('{}'));
  });

  afterEach(() => {
    mounted.splice(0).forEach((block) => block.cleanupObservers?.());
    sinon.restore();
  });

  it('moves focus to the card heading when a focused header-toggle-button is removed at the desktop breakpoint', async () => {
    await setViewport({ width: 800, height: 900 });
    const block = await mount();
    const heading = block.querySelectorAll('.card-header h3')[1];
    heading.querySelector('button.header-toggle-button').focus();
    await setViewport({ width: 1280, height: 900 });
    await waitFor(() => buttonsIn(block).length === 0);
    expect(document.activeElement).to.equal(heading);
    expect(document.activeElement).to.not.equal(document.body);
    heading.blur();
    expect(heading.hasAttribute('tabindex')).to.be.false;
  });

  it('switches header mode at 1199px and 1200px', async () => {
    await setViewport({ width: 1199, height: 900 });
    const block = await mount();
    const headers = block.querySelectorAll('.card-header');
    expect(headers.length).to.equal(3);
    headers.forEach((header) => {
      const button = header.querySelector('h3 > button.header-toggle-button');
      expect(button).to.exist;
      const content = document.getElementById(button.getAttribute('aria-controls'));
      expect(content).to.exist;
      expect(content.classList.contains('card-inner-content')).to.be.true;
    });
    await setViewport({ width: 1200, height: 900 });
    await waitFor(() => buttonsIn(block).length === 0);
    headers.forEach((header) => {
      expect(header.querySelector('button')).to.not.exist;
      expect(header.querySelector('[aria-expanded], [aria-controls]')).to.not.exist;
    });
  });

  it('toggles content with Enter and Space and keeps aria-expanded in sync below the breakpoint', async () => {
    await setViewport({ width: 800, height: 900 });
    const block = await mount();
    const button = block.querySelectorAll('.card-header button.header-toggle-button')[1];
    const content = document.getElementById(button.getAttribute('aria-controls'));
    button.focus();
    const wasHidden = content.classList.contains('hide');
    await sendKeys({ press: 'Enter' });
    expect(content.classList.contains('hide')).to.equal(!wasHidden);
    expect(button.getAttribute('aria-expanded')).to.equal(String(!content.classList.contains('hide')));
    await sendKeys({ press: 'Space' });
    expect(content.classList.contains('hide')).to.equal(wasHidden);
    expect(button.getAttribute('aria-expanded')).to.equal(String(!content.classList.contains('hide')));
  });

  it('leaves no duplicate buttons or stale aria-expanded after desktop to mobile to desktop', async () => {
    await setViewport({ width: 1280, height: 900 });
    const block = await mount();
    await setViewport({ width: 800, height: 900 });
    await waitFor(() => buttonsIn(block).length === 3);
    block.querySelectorAll('.card-header').forEach((header) => {
      expect(header.querySelectorAll('.header-toggle-button').length).to.be.at.most(1);
    });
    await setViewport({ width: 1280, height: 900 });
    await waitFor(() => buttonsIn(block).length === 0);
    block.querySelectorAll('.card-header').forEach((header) => {
      expect(header.querySelector('button')).to.not.exist;
      expect(header.querySelector('[aria-expanded], [aria-controls]')).to.not.exist;
      expect(header.querySelector('h3').hasAttribute('tabindex')).to.be.false;
    });
  });

  it('has no button semantics on desktop for the Individuals, Business and Students tab content', async () => {
    await setViewport({ width: 1280, height: 900 });
    for (const selector of ['.tab-individuals', '.tab-business', '.tab-students']) {
      // eslint-disable-next-line no-await-in-loop
      const block = await mount(selector);
      const headers = block.querySelectorAll('.card-header');
      expect(headers.length).to.equal(3);
      headers.forEach((header) => {
        expect(header.querySelector('button, [role="button"], [aria-expanded], [aria-controls]')).to.not.exist;
        expect(header.querySelector('h3').textContent.trim()).to.not.be.empty;
      });
    }
  });

  it('classifies each tooltip icon independently', async () => {
    const { setConfig } = await import('../../mocks/libs/utils/utils.js');
    setConfig({ codeRoot: '/express/code' });
    await setViewport({ width: 1280, height: 900 });
    const block = await mount('.tab-individuals');
    await waitFor(() => block.querySelectorAll('.image-tooltip > button').length === 3, 5000);
    const icons = block.querySelectorAll('.plan-icon-list > *');
    expect(icons.length).to.equal(6);
    icons.forEach((icon) => {
      if (icon.matches('.image-tooltip')) {
        const button = icon.querySelector(':scope > button');
        expect(button).to.exist;
        expect(button.getAttribute('aria-label')).to.not.be.empty;
      } else {
        expect(icon.closest('button, [role="button"]')).to.not.exist;
        expect(icon.hasAttribute('aria-expanded')).to.be.false;
        expect(icon.getAttribute('alt')).to.match(/Adobe/);
      }
    });
  });

  it('renders plain headings without button semantics on desktop', async () => {
    await setViewport({ width: 1280, height: 900 });
    const block = await mount();
    const headers = block.querySelectorAll('.card-header');
    expect(headers.length).to.equal(3);
    headers.forEach((header) => {
      expect(header.querySelector('button, [role="button"]')).to.not.exist;
      expect(header.querySelector('[aria-expanded], [aria-controls]')).to.not.exist;
      expect(header.querySelector('h3').textContent.trim()).to.not.be.empty;
      const chevron = header.querySelector('.toggle-switch-wrapper img');
      expect(chevron.getAttribute('alt')).to.equal('');
    });
  });

  it('renders accordion buttons with synced ARIA below the desktop breakpoint', async () => {
    await setViewport({ width: 800, height: 900 });
    const block = await mount();
    const buttons = block.querySelectorAll('.card-header h3 > button.header-toggle-button');
    expect(buttons.length).to.equal(3);
    buttons.forEach((button) => {
      const content = document.getElementById(button.getAttribute('aria-controls'));
      expect(content).to.exist;
      expect(button.getAttribute('aria-expanded')).to.equal(content.classList.contains('hide') ? 'false' : 'true');
    });
    const [first, second] = buttons;
    const secondContent = document.getElementById(second.getAttribute('aria-controls'));
    expect(secondContent.classList.contains('hide')).to.be.true;
    second.click();
    expect(secondContent.classList.contains('hide')).to.be.false;
    expect(second.getAttribute('aria-expanded')).to.equal('true');
    expect(first).to.exist;
  });

  it('uses unique content ids across block instances', async () => {
    await setViewport({ width: 800, height: 900 });
    await mount();
    document.body.insertAdjacentHTML('beforeend', body);
    const second = document.querySelectorAll('.simplified-pricing-cards-v2')[1];
    await decorate(second);
    const ids = [...document.querySelectorAll('.card-inner-content')].map((c) => c.id);
    expect(new Set(ids).size).to.equal(ids.length);
  });
});
