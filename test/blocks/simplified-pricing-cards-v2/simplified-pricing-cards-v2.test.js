/* eslint-env mocha */
import { readFile, setViewport } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

window.isTestEnv = true;

await import('../../../express/code/scripts/scripts.js');
const { setLibs } = await import('../../../express/code/scripts/utils.js');
setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
const { default: decorate } = await import('../../../express/code/blocks/simplified-pricing-cards-v2/simplified-pricing-cards-v2.js');

const body = await readFile({ path: './mocks/body.html' });

async function mount() {
  document.body.innerHTML = body;
  const block = document.querySelector('.simplified-pricing-cards-v2');
  await decorate(block);
  return block;
}

describe('simplified-pricing-cards-v2 header semantics', () => {
  beforeEach(() => {
    sinon.stub(window, 'fetch').resolves(new Response('{}'));
  });

  afterEach(() => {
    sinon.restore();
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
