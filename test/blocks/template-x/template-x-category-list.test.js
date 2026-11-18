import { expect } from '@esm-bundle/chai';
import { setViewport } from '@web/test-runner-commands';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { initCategoryListFocusExpansion } from '../../../express/code/blocks/template-x/template-x.js';

setLibs('/libs');

function buildFixture() {
  const block = document.createElement('div');
  block.className = 'template-x with-categories-list';
  const toolbar = document.createElement('div');
  toolbar.className = 'api-templates-toolbar';
  const wrapper = document.createElement('div');
  wrapper.className = 'category-list-wrapper';
  const toggle = document.createElement('div');
  toggle.className = 'category-list-toggle-wrapper';
  toggle.setAttribute('aria-expanded', 'false');
  const list = document.createElement('ul');
  list.className = 'category-list';
  ['one', 'two'].forEach((label) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${label}`;
    a.textContent = label;
    li.append(a);
    list.append(li);
  });
  wrapper.append(toggle, list);
  toolbar.append(wrapper);
  block.append(toolbar);
  const outside = document.createElement('button');
  document.body.append(block, outside);
  return { block, wrapper, toggle, list, outside };
}

// focus() fires no events when the headless tab lacks page focus, so also dispatch the
// events a real focus move produces. The handler is idempotent, so a duplicate is harmless.
function focusOn(el, from) {
  if (from) {
    from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: el }));
  }
  el.focus();
  el.dispatchEvent(new FocusEvent('focusin', { bubbles: true, relatedTarget: from || null }));
}

function blurTo(from, to) {
  from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));
  to.focus();
}

describe('Template X category list focus expansion', () => {
  let fixture;

  before(async () => {
    await setViewport({ width: 1280, height: 900 });
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/express/code/blocks/template-x/template-x.css';
    document.head.append(link);
    await new Promise((resolve) => {
      link.onload = resolve;
      link.onerror = resolve;
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('expands the panel and shows the link when a hidden link receives focus', () => {
    fixture = buildFixture();
    const { wrapper, toggle, list } = fixture;
    initCategoryListFocusExpansion(wrapper, toggle);
    const link = list.querySelector('a');
    expect(wrapper.classList.contains('expanded')).to.be.false;
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');

    focusOn(link);

    expect(wrapper.classList.contains('expanded')).to.be.true;
    expect(toggle.getAttribute('aria-expanded')).to.equal('true');
    const linkRect = link.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    expect(linkRect.left).to.be.at.least(wrapperRect.left);
    expect(linkRect.right).to.be.at.most(wrapperRect.right);
  });

  it('collapses again when focus leaves', () => {
    fixture = buildFixture();
    const { wrapper, toggle, list, outside } = fixture;
    initCategoryListFocusExpansion(wrapper, toggle);
    const link = list.querySelector('a');
    focusOn(link);
    expect(wrapper.classList.contains('expanded')).to.be.true;
    blurTo(link, outside);

    expect(wrapper.classList.contains('expanded')).to.be.false;
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
  });

  it('stays expanded while focus moves between links', () => {
    fixture = buildFixture();
    const { wrapper, toggle, list } = fixture;
    initCategoryListFocusExpansion(wrapper, toggle);
    const [first, second] = list.querySelectorAll('a');
    focusOn(first);
    focusOn(second, first);

    expect(wrapper.classList.contains('expanded')).to.be.true;
  });

  it('expands and restores a collapsed drawer list', () => {
    fixture = buildFixture();
    const { wrapper, toggle, list, outside } = fixture;
    wrapper.classList.add('collapsed');
    wrapper.style.maxHeight = '24px';
    toggle.classList.add('collapsed');
    initCategoryListFocusExpansion(wrapper, toggle);

    const link = list.querySelector('a');
    focusOn(link);
    expect(wrapper.classList.contains('collapsed')).to.be.false;
    expect(wrapper.style.maxHeight).to.equal('1000px');

    blurTo(link, outside);
    expect(wrapper.classList.contains('collapsed')).to.be.true;
    expect(wrapper.style.maxHeight).to.equal('24px');
    expect(toggle.getAttribute('aria-expanded')).to.equal('false');
  });
});
