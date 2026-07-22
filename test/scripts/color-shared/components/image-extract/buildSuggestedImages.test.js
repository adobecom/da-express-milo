/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import buildSuggestedImages from '../../../../../express/code/scripts/color-shared/components/image-extract/buildSuggestedImages.js';

function buildRow(srcs = []) {
  const row = document.createElement('div');
  const label = document.createElement('div');
  label.textContent = 'Try our images:';
  const list = document.createElement('div');
  srcs.forEach((src) => {
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    picture.append(img);
    list.append(picture);
  });
  row.append(label, list);
  return row;
}

describe('buildSuggestedImages', () => {
  afterEach(() => sinon.restore());

  describe('wrapper structure', () => {
    it('returns an element with class color-extract-suggestions', () => {
      const wrapper = buildSuggestedImages(null, () => {}, {});
      expect(wrapper.classList.contains('color-extract-suggestions')).to.be.true;
    });

    it('contains a list with class color-extract-suggestions-list', () => {
      const wrapper = buildSuggestedImages(null, () => {}, {});
      expect(wrapper.querySelector('.color-extract-suggestions-list')).to.exist;
    });
  });

  describe('label', () => {
    it('uses the first child of row as label', () => {
      const row = buildRow([]);
      const labelEl = row.children[0];
      const wrapper = buildSuggestedImages(row, () => {}, {});
      expect(wrapper.querySelector('.color-extract-suggestions-label')).to.equal(labelEl);
    });

    it('adds color-extract-suggestions-label class to the row label', () => {
      const row = buildRow([]);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      expect(wrapper.querySelector('.color-extract-suggestions-label')).to.exist;
    });

    it('creates a default label when row is null', () => {
      const wrapper = buildSuggestedImages(null, () => {}, {});
      const label = wrapper.querySelector('.color-extract-suggestions-label');
      expect(label).to.exist;
      expect(label.textContent).to.include('image');
    });

    it('uses strings.noImageTryOurs for the default label text', () => {
      const wrapper = buildSuggestedImages(null, () => {}, { strings: { noImageTryOurs: 'Use one of ours' } });
      const label = wrapper.querySelector('.color-extract-suggestions-label');
      expect(label.textContent).to.equal('Use one of ours');
    });
  });

  describe('suggestion buttons', () => {
    it('creates one button per picture', () => {
      const row = buildRow(['a.jpg', 'b.jpg', 'c.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      expect(wrapper.querySelectorAll('.color-extract-suggestion')).to.have.length(3);
    });

    it('creates no buttons when row has no pictures', () => {
      const wrapper = buildSuggestedImages(null, () => {}, {});
      expect(wrapper.querySelectorAll('.color-extract-suggestion')).to.have.length(0);
    });

    it('each button has type="button"', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      expect(button.getAttribute('type')).to.equal('button');
    });

    it('each button has aria-pressed="false" initially', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      expect(button.getAttribute('aria-pressed')).to.equal('false');
    });

    it('uses strings.useThisImage for button aria-label', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, { strings: { useThisImage: 'Choisir cette image' } });
      const button = wrapper.querySelector('.color-extract-suggestion');
      expect(button.getAttribute('aria-label')).to.equal('Choisir cette image');
    });

    it('falls back to default aria-label when strings.useThisImage is absent', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      expect(button.getAttribute('aria-label')).to.equal('Use this image');
    });

    it('makes preview images non-draggable', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const img = wrapper.querySelector('.color-extract-suggestion img');
      expect(img.draggable).to.be.false;
    });
  });

  describe('palette variant (default)', () => {
    it('creates a color bar without is-gradient class', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const bar = wrapper.querySelector('.color-extract-suggestion-bar');
      expect(bar.classList.contains('is-gradient')).to.be.false;
    });

    it('creates exactly 5 chip spans inside the bar', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      expect(wrapper.querySelectorAll('.color-extract-suggestion-chip')).to.have.length(5);
    });

    it('chips have indexed classes is-1 through is-5', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      for (let i = 1; i <= 5; i += 1) {
        expect(wrapper.querySelector(`.color-extract-suggestion-chip.is-${i}`)).to.exist;
      }
    });
  });

  describe('gradient variant', () => {
    it('creates a color bar with is-gradient class', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, { variant: 'gradient' });
      const bar = wrapper.querySelector('.color-extract-suggestion-bar');
      expect(bar.classList.contains('is-gradient')).to.be.true;
    });

    it('does not create chip spans for gradient variant', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, { variant: 'gradient' });
      expect(wrapper.querySelectorAll('.color-extract-suggestion-chip')).to.have.length(0);
    });
  });

  describe('decorateButton callback', () => {
    it('is called once per button when provided', () => {
      const decorateButton = sinon.spy();
      const row = buildRow(['a.jpg', 'b.jpg']);
      buildSuggestedImages(row, () => {}, { decorateButton });
      expect(decorateButton.callCount).to.equal(2);
    });

    it('is called with the button element', () => {
      const decorateButton = sinon.spy();
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, { decorateButton });
      const button = wrapper.querySelector('.color-extract-suggestion');
      expect(decorateButton.calledWith(button)).to.be.true;
    });

    it('is not required — builds without error when omitted', () => {
      const row = buildRow(['img.jpg']);
      expect(() => buildSuggestedImages(row, () => {}, {})).to.not.throw();
    });
  });

  describe('click handler', () => {
    it('adds is-selected class to clicked button', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      button.click();
      expect(button.classList.contains('is-selected')).to.be.true;
    });

    it('sets aria-pressed="true" on clicked button', () => {
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      button.click();
      expect(button.getAttribute('aria-pressed')).to.equal('true');
    });

    it('deselects a previously selected button when a new one is clicked', () => {
      const row = buildRow(['a.jpg', 'b.jpg']);
      const wrapper = buildSuggestedImages(row, () => {}, {});
      const [first, second] = wrapper.querySelectorAll('.color-extract-suggestion');
      first.click();
      second.click();
      expect(first.classList.contains('is-selected')).to.be.false;
      expect(first.getAttribute('aria-pressed')).to.equal('false');
      expect(second.classList.contains('is-selected')).to.be.true;
    });

    it('calls onSelect immediately when preview image is already loaded', () => {
      const onSelect = sinon.spy();
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, onSelect, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      const img = button.querySelector('img');
      Object.defineProperty(img, 'naturalWidth', { value: 100, configurable: true });
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      button.click();
      expect(onSelect.calledOnce).to.be.true;
      expect(onSelect.args[0][0]).to.equal(img);
    });

    it('calls onSelect when load event fires after click on unloaded image', () => {
      const onSelect = sinon.spy();
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, onSelect, {});
      const button = wrapper.querySelector('.color-extract-suggestion');
      const img = button.querySelector('img');
      button.click();
      img.dispatchEvent(new Event('load'));
      expect(onSelect.calledOnce).to.be.true;
    });

    it('does not call onSelect before a load event when image is unloaded', () => {
      const onSelect = sinon.spy();
      const row = buildRow(['img.jpg']);
      const wrapper = buildSuggestedImages(row, onSelect, {});
      wrapper.querySelector('.color-extract-suggestion').click();
      expect(onSelect.called).to.be.false;
    });
  });
});
