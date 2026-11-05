import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = {};
  mod.setConfig(conf);
});
const [{ default: decorate }] = await Promise.all([import('../../../express/code/blocks/ax-panels/ax-panels.js')]);
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

function isSelected(tab) {
  return tab.getAttribute('aria-selected') === 'true' && tab.getAttribute('tabindex') === '0';
}

describe('ax-panels', () => {
  let block;
  before(async () => {
    block = document.querySelector('.ax-panels');
    await decorate(block);
  });
  it('has correct block structures', async () => {
    expect(block.querySelector('.ax-panels-heading-container')).to.exist;
    const tablist = block.querySelector('[role=tablist]');
    expect(tablist).to.exist;
    const tabs = [...tablist.querySelectorAll('[role=tab]')];
    expect(tabs.length === 5).to.be.true;
    tabs.forEach((tab, index) => {
      expect(isSelected(tab)).to.equal(index === 0);
      expect(tab.id).to.not.be.empty;
      expect(tab.getAttribute('aria-controls')).to.not.be.empty;
    });
  });

  it('handles clicks', async () => {
    const tabs = [...block.querySelectorAll('[role=tab]')];
    tabs[0].click();
    tabs.forEach((tab, index) => {
      expect(isSelected(tab)).to.equal(index === 0);
      expect(tab.id).to.not.be.empty;
      expect(tab.getAttribute('aria-controls')).to.not.be.empty;
    });
    tabs[2].click();
    expect(isSelected(tabs[0])).to.be.false;
    expect(isSelected(tabs[2])).to.be.true;
  });

  it('does not append missing icons as text', async () => {
    const markup = await readFile({ path: './mocks/body.html' });
    const main = new DOMParser().parseFromString(markup, 'text/html').querySelector('main');
    main.querySelectorAll('.icon').forEach((icon) => icon.remove());
    const iconlessBlock = main.querySelector('.ax-panels');
    await decorate(iconlessBlock);
    const tabs = [...iconlessBlock.querySelectorAll('[role=tab]')];
    tabs.forEach((tab) => expect(tab.textContent).to.not.include('null'));
  });

  it('handles RTL keyboard interactions', () => {
    const tabs = [...block.querySelectorAll('[role=tab]')];
    const tablist = block.querySelector('[role=tablist]');
    tablist.dir = 'rtl';
    try {
      tabs[0].click();
      tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(isSelected(tabs[1])).to.be.true;
      tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(isSelected(tabs[0])).to.be.true;
      tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(isSelected(tabs[tabs.length - 1])).to.be.true;
    } finally {
      tablist.removeAttribute('dir');
    }
  });

  it('handles keyboard interactions', async () => {
    const tabs = [...block.querySelectorAll('[role=tab]')];
    const tablist = block.querySelector('[role=tablist]');
    tabs[0].click();
    expect(isSelected(tabs[0])).to.be.true;
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(isSelected(tabs[0])).to.be.false;
    expect(isSelected(tabs[1])).to.be.true;
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(isSelected(tabs[1])).to.be.false;
    expect(isSelected(tabs[2])).to.be.true;
    tabs[0].click();
    expect(isSelected(tabs[2])).to.be.false;
    expect(isSelected(tabs[0])).to.be.true;
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(isSelected(tabs[0])).to.be.false;
    expect(isSelected(tabs[tabs.length - 1])).to.be.true;
  });

  it('toggles sections', async () => {
    const tabs = [...block.querySelectorAll('[role=tab]')];
    const sections = [...document.querySelectorAll('[role=tabpanel]')];
    tabs[0].click();
    sections.forEach((section, index) => {
      expect(section.classList.contains('hide')).to.equal(index !== 0);
    });
    tabs[1].click();
    expect(sections[0].classList.contains('hide')).to.be.true;
    expect(sections[1].classList.contains('hide')).to.be.false;
    tabs[3].click();
    expect(sections[1].classList.contains('hide')).to.be.true;
    expect(sections[3].classList.contains('hide')).to.be.false;
  });
});
