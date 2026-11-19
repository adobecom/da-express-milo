/* eslint-env mocha */
// Offline setup: the mocked replaceKeyArray (test/mocks/libs) echoes unset keys and reads
// window.placeholders, so the option maps the block JSON.parses are supplied through it.

import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

await import('../../../express/code/scripts/scripts.js');
const { setLibs } = await import('../../../express/code/scripts/utils.js');
setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });
const { initDeps, makeTemplateFunctions, decorateFunctionsContainer } = await import('../../../express/code/blocks/template-x/template-x.js');

const OPTION_MAPS = {
  'template-filter-premium': JSON.stringify({ Free: 'free', Premium: 'premium' }),
  'template-filter-animated': JSON.stringify({ Static: 'static', Animated: 'animated' }),
  'template-x-sort': JSON.stringify({ 'Most Relevant': '-_score', Newest: '-create_date' }),
};

const accessibleName = (el, root) => el.getAttribute('aria-labelledby').split(' ')
  .map((id) => root.querySelector(`#${id}`).textContent.trim())
  .join(' ');

describe('template-x filter labels', () => {
  let desktop;
  let mobile;
  let root;

  const build = async (extra = {}) => {
    window.placeholders = { ...OPTION_MAPS, ...extra };
    await initDeps();
    ({ desktop, mobile } = await decorateFunctionsContainer(
      document.createElement('div'),
      await makeTemplateFunctions(),
    ));
    root = document.createElement('div');
    root.append(desktop, mobile);
    document.body.append(root);
  };

  afterEach(() => {
    root?.remove();
    delete window.placeholders;
  });

  it('shows a visible label linked to each desktop trigger', async () => {
    await build({
      'template-filter-premium-label': 'Price',
      'template-filter-animated-label': 'Format',
      'template-x-sort-label': 'Sort by',
    });
    const buttons = desktop.querySelectorAll('.button-wrapper');
    expect(buttons.length).to.equal(3);
    buttons.forEach((button) => {
      const label = root.querySelector(`#${button.getAttribute('aria-labelledby').split(' ')[0]}`);
      expect(label.tagName).to.equal('LABEL');
      expect(label.textContent.trim()).to.not.be.empty;
      expect(label.hasAttribute('hidden')).to.be.false;
      expect(label.classList.contains('sr-only')).to.be.false;
      expect(accessibleName(button, root)).to.contain(label.textContent.trim());
    });
  });

  it('uses unique ids and resolvable references in desktop and mobile', async () => {
    await build();
    const ids = [...root.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).to.equal(ids.length);
    root.querySelectorAll('[aria-labelledby]').forEach((el) => {
      el.getAttribute('aria-labelledby').split(' ').forEach((id) => {
        expect(root.querySelector(`#${id}`), id).to.exist;
      });
    });
  });

  it('names drawer controls by their visible heading', async () => {
    await build();
    const buttons = mobile.querySelectorAll('.button-wrapper');
    expect(buttons.length).to.equal(3);
    buttons.forEach((button) => {
      const heading = button.querySelector('.filter-mobile-option-heading');
      expect(heading.textContent.trim()).to.not.be.empty;
      expect(accessibleName(button, root)).to.contain(heading.textContent.trim());
    });
  });

  it('falls back to English labels when keys are unset', async () => {
    await build();
    const labels = [...desktop.querySelectorAll('.function-label')].map((l) => l.textContent);
    expect(labels).to.deep.equal(['Price', 'Format', 'Sort by']);
  });

  it('keeps the filter and sort hooks intact', async () => {
    await build();
    const wrappers = [...desktop.querySelectorAll('.function-wrapper')];
    expect(wrappers.map((w) => w.dataset.param)).to.deep.equal(['premium', 'animated', 'sort']);
    desktop.querySelectorAll('.button-wrapper').forEach((button) => {
      expect(button.parentElement.classList.contains('function-wrapper')).to.be.true;
    });
    wrappers.forEach((w) => {
      expect(w.querySelector('.current-option')).to.exist;
      expect(w.querySelector('.options-wrapper')).to.exist;
    });
    expect(wrappers[0].querySelector('.option-button').dataset.value).to.equal('free');
  });
});
