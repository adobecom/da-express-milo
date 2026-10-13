/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import createDropdown from '../../../../express/code/scripts/color-shared/components/dropdown/dropdown.js';
import createMoodSelector from '../../../../express/code/blocks/color-extract/helpers/moodSelector.js';

setLibs('/test/mocks/libs', { hostname: 'example.com', search: '' });

describe('shared Color dropdown', () => {
  let container;
  let dropdown;
  let mood;
  let onChange;
  const key = (element, value) => element.dispatchEvent(new KeyboardEvent('keydown', {
    key: value, bubbles: true, cancelable: true,
  }));

  before(async () => {
    await Promise.all([
      '/express/code/styles/styles.css',
      '/express/code/blocks/color-extract/color-extract.css',
      '/express/code/blocks/color-image-contrast-checker/color-image-contrast-checker.css',
    ].map((href) => new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', reject, { once: true });
      document.head.append(link);
    })));
  });

  beforeEach(() => {
    container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '32px';
    container.style.alignItems = 'flex-start';
    const checker = document.createElement('div');
    checker.className = 'color-image-contrast-checker';
    checker.style.width = '224px';
    const extract = document.createElement('div');
    extract.className = 'color-extract';
    extract.style.width = '224px';
    onChange = sinon.spy();
    dropdown = createDropdown({
      items: [{ value: 'srgb', label: 'sRGB' }, { value: 'display-p3', label: 'Display P3' }],
      value: 'srgb',
      ariaLabel: 'Color space',
      onChange,
    });
    dropdown.element.style.width = '224px';
    mood = createMoodSelector('colorful', sinon.spy());
    checker.append(dropdown.element);
    extract.append(mood.element);
    container.append(checker, extract);
    document.body.append(container);
  });

  afterEach(() => {
    dropdown.destroy();
    mood.destroy();
    container.remove();
    sinon.restore();
  });

  it('shares Extract markup, SVGs and computed trigger/menu/option styling', () => {
    const equalStyles = (selector, properties) => {
      const checkerStyle = getComputedStyle(dropdown.element.querySelector(selector));
      const extractStyle = getComputedStyle(mood.element.querySelector(selector));
      properties.forEach((property) => {
        expect(checkerStyle[property], property).to.equal(extractStyle[property]);
      });
    };
    equalStyles('.color-dropdown-trigger', [
      'height', 'padding', 'backgroundColor', 'borderRadius', 'fontSize', 'fontWeight',
      'lineHeight', 'color', 'border', 'gap',
    ]);
    expect(getComputedStyle(dropdown.trigger).backgroundColor).to.equal('rgb(225, 225, 225)');
    expect(getComputedStyle(dropdown.trigger).height).to.equal('32px');
    expect(dropdown.element.querySelector('.color-dropdown-chevron svg').outerHTML)
      .to.equal(mood.element.querySelector('.color-dropdown-chevron svg').outerHTML);
    dropdown.trigger.click();
    const menu = dropdown.element.querySelector('.color-dropdown-popover');
    expect(menu.getBoundingClientRect().top - dropdown.trigger.getBoundingClientRect().bottom)
      .to.equal(4);
    mood.element.querySelector('.color-dropdown-trigger').click();
    equalStyles('.color-dropdown-popover', [
      'padding', 'backgroundColor', 'borderRadius', 'boxShadow', 'zIndex',
    ]);
    equalStyles('.color-dropdown-option', [
      'padding', 'fontSize', 'fontWeight', 'lineHeight', 'color', 'gap', 'border',
    ]);
    equalStyles('.color-dropdown-option-check', ['color', 'opacity', 'width', 'height']);
    expect(getComputedStyle(dropdown.element.querySelector('.color-dropdown-option-check')).opacity)
      .to.equal('1');
  });

  it('uses the same actual hover and keyboard-focus styles in both consumers', async () => {
    const moodTrigger = mood.element.querySelector('.color-dropdown-trigger');
    const hover = async (element) => {
      const rect = element.getBoundingClientRect();
      await sendMouse({ type: 'move', position: [Math.round(rect.x + 10), Math.round(rect.y + 10)] });
      await new Promise((resolve) => { setTimeout(resolve, 180); });
      return getComputedStyle(element).backgroundColor;
    };
    expect(await hover(dropdown.trigger)).to.equal(await hover(moodTrigger));
    await sendMouse({ type: 'move', position: [0, 0] });
    await sendKeys({ press: 'Tab' });
    dropdown.trigger.focus();
    const checkerOutline = getComputedStyle(dropdown.trigger).outline;
    moodTrigger.focus();
    expect(checkerOutline).to.equal(getComputedStyle(moodTrigger).outline);
    expect(checkerOutline).to.include('2px');
    dropdown.trigger.click();
    const checkerOption = dropdown.element.querySelector('.color-dropdown-option');
    const checkerHover = await hover(checkerOption);
    moodTrigger.click();
    const moodOption = mood.element.querySelector('.color-dropdown-option');
    expect(checkerHover).to.equal(await hover(moodOption));
  });

  it('supports silent programmatic selection, change-only callbacks and focus restoration', () => {
    dropdown.setValue('display-p3');
    expect(onChange.called).to.equal(false);
    dropdown.trigger.click();
    const selected = dropdown.element.querySelector('[aria-selected="true"]');
    expect(document.activeElement).to.equal(selected);
    selected.click();
    expect(onChange.called).to.equal(false);
    dropdown.trigger.click();
    dropdown.element.querySelector('[data-value="srgb"]').click();
    expect(onChange.calledOnceWith('srgb')).to.equal(true);
    expect(document.activeElement).to.equal(dropdown.trigger);
    expect(dropdown.isOpen).to.equal(false);
  });

  it('wraps arrows, handles Home/End and consumes Escape before parent handlers', () => {
    const parentKey = sinon.spy();
    container.addEventListener('keydown', parentKey);
    key(dropdown.trigger, 'ArrowUp');
    const options = [...dropdown.element.querySelectorAll('[role="option"]')];
    key(options[0], 'ArrowUp');
    expect(document.activeElement).to.equal(options[1]);
    key(options[1], 'ArrowDown');
    expect(document.activeElement).to.equal(options[0]);
    key(options[0], 'End');
    expect(document.activeElement).to.equal(options[1]);
    key(options[1], 'Home');
    expect(document.activeElement).to.equal(options[0]);
    parentKey.resetHistory();
    key(options[0], 'Escape');
    expect(dropdown.isOpen).to.equal(false);
    expect(document.activeElement).to.equal(dropdown.trigger);
    expect(parentKey.called).to.equal(false);
  });

  it('continues native Tab order from the trigger, never from hidden options', async () => {
    const next = document.createElement('button');
    next.textContent = 'Next';
    dropdown.element.after(next);
    dropdown.trigger.click();
    await sendKeys({ press: 'Tab' });
    expect(dropdown.isOpen).to.equal(false);
    expect(document.activeElement).to.equal(next);
    dropdown.trigger.click();
    await sendKeys({ down: 'Shift' });
    await sendKeys({ press: 'Tab' });
    await sendKeys({ up: 'Shift' });
    expect(dropdown.isOpen).to.equal(false);
    expect(document.activeElement).not.to.equal(dropdown.trigger);
    expect(dropdown.element.contains(document.activeElement)).to.equal(false);
  });

  it('closes on outside click or focus, ignores disabled options, and aborts retained events', () => {
    dropdown.trigger.click();
    document.dispatchEvent(new MouseEvent('click'));
    expect(dropdown.isOpen).to.equal(false);
    dropdown.trigger.click();
    mood.element.querySelector('.color-dropdown-trigger').focus();
    expect(dropdown.isOpen).to.equal(false);
    dropdown.trigger.click();
    dropdown.setDisabled(true);
    expect(dropdown.isOpen).to.equal(false);
    expect(dropdown.trigger.disabled).to.equal(true);
    dropdown.element.querySelector('[data-value="display-p3"]').click();
    expect(onChange.called).to.equal(false);
    dropdown.setDisabled(false);
    dropdown.trigger.click();
    expect(dropdown.isOpen).to.equal(true);
    dropdown.destroy();
    dropdown.trigger.click();
    dropdown.element.querySelector('[data-value="display-p3"]').click();
    expect(dropdown.isOpen).to.equal(false);
    expect(onChange.called).to.equal(false);
  });

  it('preserves inherited Extract marker colors and transparent/black defaults without CSS suppressions', () => {
    const marker = document.createElement('div');
    marker.className = 'color-extract-marker is-active';
    const dot = document.createElement('span');
    dot.className = 'color-extract-marker-dot';
    marker.append(dot);
    mood.element.append(marker);
    expect(getComputedStyle(marker).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(dot).backgroundColor).to.equal('rgb(0, 0, 0)');
    marker.style.setProperty('--marker-color', '#123456');
    expect(getComputedStyle(dot).backgroundColor).to.equal('rgb(18, 52, 86)');
    marker.classList.remove('is-active');
    expect(getComputedStyle(marker).backgroundColor).to.equal('rgb(18, 52, 86)');
  });
});
