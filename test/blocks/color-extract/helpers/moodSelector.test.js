/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../express/code/scripts/utils.js';
import createMoodSelector from '../../../../express/code/blocks/color-extract/helpers/moodSelector.js';
import { MOOD_LIST, MOODS } from '../../../../express/code/blocks/color-extract/helpers/constants.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

function key(element, k) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
}

describe('createMoodSelector', () => {
  let container;
  let onChange;
  let selector;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    onChange = sinon.stub();
    selector = createMoodSelector(MOODS.COLORFUL, onChange);
    container.appendChild(selector.element);
  });

  afterEach(() => {
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    container.remove();
    sinon.restore();
  });

  const getTrigger = () => selector.element.querySelector('.color-extract-mood-trigger');
  const getPopover = () => selector.element.querySelector('.color-extract-mood-popover');
  const getOptions = () => [...selector.element.querySelectorAll('.color-extract-mood-option')];

  // ── DOM structure ──────────────────────────────────────────────────────────

  describe('DOM structure', () => {
    it('renders mood label text', () => {
      const label = selector.element.querySelector('.color-extract-mood-label');
      expect(label).to.exist;
      expect(label.textContent).to.equal('Color mood');
    });

    it('trigger is a <button> with aria-haspopup="listbox"', () => {
      const trigger = getTrigger();
      expect(trigger.tagName.toLowerCase()).to.equal('button');
      expect(trigger.getAttribute('aria-haspopup')).to.equal('listbox');
    });

    it('popover has role="listbox"', () => {
      expect(getPopover().getAttribute('role')).to.equal('listbox');
    });

    it('renders one option per mood', () => {
      expect(getOptions().length).to.equal(MOOD_LIST.length);
    });

    it('each option has role="option"', () => {
      getOptions().forEach((opt) => {
        expect(opt.getAttribute('role')).to.equal('option');
      });
    });
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('trigger aria-expanded is "false"', () => {
      expect(getTrigger().getAttribute('aria-expanded')).to.equal('false');
    });

    it('popover is hidden', () => {
      expect(getPopover().hidden).to.be.true;
    });

    it('initialMood option has aria-selected="true" and is-selected class', () => {
      const selected = getOptions().find((o) => o.dataset.mood === MOODS.COLORFUL);
      expect(selected.getAttribute('aria-selected')).to.equal('true');
      expect(selected.classList.contains('is-selected')).to.be.true;
    });

    it('non-initial options have aria-selected="false"', () => {
      getOptions()
        .filter((o) => o.dataset.mood !== MOODS.COLORFUL)
        .forEach((o) => expect(o.getAttribute('aria-selected')).to.equal('false'));
    });
  });

  // ── Open / close ───────────────────────────────────────────────────────────

  describe('open / close', () => {
    it('clicking trigger opens the popover', () => {
      getTrigger().click();
      expect(getPopover().hidden).to.be.false;
      expect(getTrigger().getAttribute('aria-expanded')).to.equal('true');
    });

    it('clicking trigger again closes the popover', () => {
      getTrigger().click();
      getTrigger().click();
      expect(getPopover().hidden).to.be.true;
      expect(getTrigger().getAttribute('aria-expanded')).to.equal('false');
    });

    it('document click closes the popover', () => {
      getTrigger().click();
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(getPopover().hidden).to.be.true;
    });

    it('opening focuses the selected option', () => {
      getTrigger().click();
      const selected = getOptions().find((o) => o.classList.contains('is-selected'));
      expect(document.activeElement).to.equal(selected);
    });

    it('opening with no is-selected option focuses the first option', () => {
      getOptions().forEach((o) => o.classList.remove('is-selected'));
      getTrigger().click();
      expect(document.activeElement).to.equal(getOptions()[0]);
    });
  });

  // ── Option selection ───────────────────────────────────────────────────────

  describe('option selection', () => {
    beforeEach(() => { getTrigger().click(); });

    it('clicking a new option calls onChange with the mood value', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.BRIGHT).click();
      expect(onChange.calledOnceWith(MOODS.BRIGHT)).to.be.true;
    });

    it('clicking a new option closes the popover', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.DARK).click();
      expect(getPopover().hidden).to.be.true;
    });

    it('clicking a new option updates aria-selected', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.MUTED).click();
      getOptions().forEach((o) => {
        expect(o.getAttribute('aria-selected')).to.equal(o.dataset.mood === MOODS.MUTED ? 'true' : 'false');
      });
    });

    it('clicking a new option updates trigger text', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.DEEP).click();
      expect(selector.element.querySelector('.color-extract-mood-trigger-text').textContent).to.equal('Deep');
    });

    it('clicking a new option returns focus to trigger', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.BRIGHT).click();
      expect(document.activeElement).to.equal(getTrigger());
    });

    it('clicking the already-selected option closes popover without calling onChange', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.COLORFUL).click();
      expect(onChange.called).to.be.false;
      expect(getPopover().hidden).to.be.true;
    });

    it('clicking the already-selected option returns focus to trigger', () => {
      getOptions().find((o) => o.dataset.mood === MOODS.COLORFUL).click();
      expect(document.activeElement).to.equal(getTrigger());
    });
  });

  // ── setMood() API ──────────────────────────────────────────────────────────

  describe('setMood()', () => {
    it('updates trigger text', () => {
      selector.setMood(MOODS.DARK);
      expect(selector.element.querySelector('.color-extract-mood-trigger-text').textContent).to.equal('Dark');
    });

    it('updates aria-selected on all options', () => {
      selector.setMood(MOODS.DEEP);
      getOptions().forEach((o) => {
        expect(o.getAttribute('aria-selected')).to.equal(o.dataset.mood === MOODS.DEEP ? 'true' : 'false');
      });
    });

    it('does not call onChange', () => {
      selector.setMood(MOODS.MUTED);
      expect(onChange.called).to.be.false;
    });
  });

  // ── Keyboard — trigger ─────────────────────────────────────────────────────

  describe('keyboard — trigger', () => {
    it('Escape on trigger closes the popover', () => {
      getTrigger().click();
      key(getTrigger(), 'Escape');
      expect(getPopover().hidden).to.be.true;
    });

    it('ArrowDown on trigger opens the popover', () => {
      key(getTrigger(), 'ArrowDown');
      expect(getPopover().hidden).to.be.false;
    });

    it('ArrowUp on trigger opens the popover', () => {
      key(getTrigger(), 'ArrowUp');
      expect(getPopover().hidden).to.be.false;
    });

    it('Enter on trigger opens the popover', () => {
      key(getTrigger(), 'Enter');
      expect(getPopover().hidden).to.be.false;
    });

    it('Space on trigger opens the popover', () => {
      key(getTrigger(), ' ');
      expect(getPopover().hidden).to.be.false;
    });

    it('ArrowDown focuses the selected option on open', () => {
      key(getTrigger(), 'ArrowDown');
      expect(document.activeElement).to.equal(getOptions().find((o) => o.classList.contains('is-selected')));
    });
  });

  // ── Keyboard — arrow navigation ────────────────────────────────────────────

  describe('keyboard — arrow navigation', () => {
    let options;

    beforeEach(() => {
      getTrigger().click();
      options = getOptions();
    });

    it('ArrowDown moves focus to the next option', () => {
      options[0].focus();
      key(options[0], 'ArrowDown');
      expect(document.activeElement).to.equal(options[1]);
    });

    it('ArrowDown wraps from the last option to the first', () => {
      options[options.length - 1].focus();
      key(options[options.length - 1], 'ArrowDown');
      expect(document.activeElement).to.equal(options[0]);
    });

    it('ArrowUp moves focus to the previous option', () => {
      options[2].focus();
      key(options[2], 'ArrowUp');
      expect(document.activeElement).to.equal(options[1]);
    });

    it('ArrowUp wraps from the first option to the last', () => {
      options[0].focus();
      key(options[0], 'ArrowUp');
      expect(document.activeElement).to.equal(options[options.length - 1]);
    });

    it('Home moves focus to the first option', () => {
      options[3].focus();
      key(options[3], 'Home');
      expect(document.activeElement).to.equal(options[0]);
    });

    it('End moves focus to the last option', () => {
      options[1].focus();
      key(options[1], 'End');
      expect(document.activeElement).to.equal(options[options.length - 1]);
    });

    it('Escape closes the popover and returns focus to trigger', () => {
      options[2].focus();
      key(options[2], 'Escape');
      expect(getPopover().hidden).to.be.true;
      expect(document.activeElement).to.equal(getTrigger());
    });

    it('Tab closes the popover', () => {
      key(options[1], 'Tab');
      expect(getPopover().hidden).to.be.true;
    });
  });
});
