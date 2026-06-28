/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../../express/code/scripts/utils.js';
import { createLibraryAccordion } from '../../../../../express/code/scripts/color-shared/components/libraries/createLibraryAccordion.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const strings = createColorLibrariesPlaceholders();

const sampleLibrary = {
  id: 'lib-1',
  name: 'Brand Colors',
  themeCount: 1,
  gradientCount: 1,
  items: [
    {
      id: 'theme-1',
      type: 'theme',
      name: 'Sunset',
      colors: ['#FF0000', '#00FF00'],
    },
    {
      id: 'grad-1',
      type: 'gradient',
      name: 'Fade',
      colorStops: [
        { color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }], offset: 0 },
        { color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }], offset: 1 },
      ],
    },
  ],
};

describe('createLibraryAccordion', () => {
  let instance;

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders library name, counts, and item cards', () => {
    instance = createLibraryAccordion(sampleLibrary, { expanded: true, strings });
    document.body.appendChild(instance.element);

    expect(instance.element.classList.contains('ax-lib-accordion--open')).to.be.true;
    expect(instance.element.querySelector('.ax-lib-accordion-name').textContent).to.equal('Brand Colors');
    expect(instance.element.querySelectorAll('.ax-lib-card')).to.have.lengthOf(2);
    expect(instance.element.querySelector('.ax-lib-toggle-icon')).to.exist;
  });

  it('hides panel when collapsed', () => {
    instance = createLibraryAccordion(sampleLibrary, { expanded: false, strings });
    const panel = instance.element.querySelector('.ax-lib-accordion-panel');
    expect(panel.hasAttribute('hidden')).to.be.true;
    expect(instance.element.querySelector('.ax-lib-accordion-header').getAttribute('aria-expanded')).to.equal('false');
  });

  it('setExpanded toggles panel visibility and icon children', () => {
    instance = createLibraryAccordion(sampleLibrary, { expanded: false, strings });
    const icon = instance.element.querySelector('.ax-lib-toggle-icon');
    const initialChildCount = icon.childNodes.length;

    instance.setExpanded(true);

    const panel = instance.element.querySelector('.ax-lib-accordion-panel');
    expect(panel.hasAttribute('hidden')).to.be.false;
    expect(instance.element.classList.contains('ax-lib-accordion--open')).to.be.true;
    expect(icon.childNodes.length).to.be.at.least(initialChildCount);

    instance.setExpanded(false);
    expect(panel.hasAttribute('hidden')).to.be.true;
  });

  it('calls onToggle when header is clicked', () => {
    const onToggle = sinon.spy();
    instance = createLibraryAccordion(sampleLibrary, { strings, onToggle });
    instance.element.querySelector('.ax-lib-accordion-header').click();
    expect(onToggle.calledOnceWith('lib-1')).to.be.true;
  });

  it('adds search-result modifier class when requested', () => {
    instance = createLibraryAccordion(sampleLibrary, { strings, searchResult: true });
    expect(instance.element.classList.contains('ax-lib-accordion--search-result')).to.be.true;
  });
});
