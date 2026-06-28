/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../../express/code/scripts/utils.js';
import {
  createLibrariesComponent,
  LIBRARY_SIZE,
  LIBRARY_VIEW,
} from '../../../../../express/code/scripts/color-shared/components/libraries/createLibrariesComponent.js';
import { LIBRARY_SORT } from '../../../../../express/code/scripts/color-shared/components/libraries/createLibrariesHeader.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const strings = createColorLibrariesPlaceholders();

const sampleLibraries = [
  {
    id: 'lib-a',
    name: 'Alpha',
    themeCount: 1,
    gradientCount: 0,
    items: [{
      id: 't1',
      type: 'theme',
      name: 'Theme A',
      colors: ['#FF0000'],
    }],
  },
  {
    id: 'lib-b',
    name: 'Beta',
    themeCount: 1,
    gradientCount: 0,
    items: [{
      id: 't2',
      type: 'theme',
      name: 'Theme B',
      colors: ['#00FF00'],
    }],
  },
];

function cloneLibraries(libraries = sampleLibraries) {
  return libraries.map((library) => ({
    ...library,
    items: library.items.map((item) => ({ ...item })),
  }));
}

describe('createLibrariesComponent', () => {
  let instance;

  afterEach(() => {
    instance?.destroy?.();
    instance = null;
    document.body.innerHTML = '';
  });

  it('returns container with header and library list for default view', () => {
    instance = createLibrariesComponent({ strings, libraries: cloneLibraries() });
    document.body.appendChild(instance.element);

    expect(instance.element.classList.contains('ax-libraries--view-library')).to.be.true;
    expect(instance.element.querySelector('.ax-lib-header')).to.exist;
    expect(instance.element.querySelectorAll('.ax-lib-accordion')).to.have.lengthOf(2);
  });

  it('setView switches to loading state', () => {
    instance = createLibrariesComponent({ strings, libraries: [] });
    instance.setView(LIBRARY_VIEW.LOADING);
    expect(instance.element.querySelector('.ax-lib-loading')).to.exist;
    expect(instance.element.classList.contains('ax-libraries--view-loading')).to.be.true;
  });

  it('setView switches to empty search state', () => {
    instance = createLibrariesComponent({ strings, libraries: [] });
    instance.setView(LIBRARY_VIEW.EMPTY, { query: 'missing' });
    expect(instance.element.querySelector('.ax-lib-empty')).to.exist;
    expect(instance.element.querySelector('.ax-lib-empty__heading').textContent).to.include('missing');
  });

  it('setView switches to search result state', () => {
    instance = createLibrariesComponent({ strings, libraries: cloneLibraries() });
    instance.setView(LIBRARY_VIEW.SEARCH_RESULT);
    expect(instance.element.classList.contains('ax-libraries--view-search-result')).to.be.true;
  });

  it('setCount updates header count', () => {
    instance = createLibrariesComponent({ strings, libraries: cloneLibraries() });
    instance.setCount(5);
    expect(instance.element.querySelector('.ax-lib-header__count').textContent).to.equal('5 saved libraries');
  });

  it('setLibraries replaces rendered accordions', () => {
    instance = createLibrariesComponent({ strings, libraries: cloneLibraries() });
    instance.setLibraries(cloneLibraries([sampleLibraries[0]]));
    expect(instance.element.querySelectorAll('.ax-lib-accordion')).to.have.lengthOf(1);
  });

  it('setSize updates size class on container', () => {
    instance = createLibrariesComponent({
      strings,
      libraries: cloneLibraries(),
      size: LIBRARY_SIZE.L,
    });
    instance.setSize(LIBRARY_SIZE.S);
    expect(instance.element.classList.contains('ax-libraries--size-m-s')).to.be.true;
  });

  it('renders libraries sorted by name when initialSort is name', () => {
    instance = createLibrariesComponent({
      strings,
      libraries: cloneLibraries(),
      initialSort: LIBRARY_SORT.NAME,
    });
    const names = [...instance.element.querySelectorAll('.ax-lib-accordion-name')]
      .map((el) => el.textContent);
    expect(names).to.deep.equal(['Alpha', 'Beta']);
  });

  it('emits empty-go-back when empty CTA is clicked', () => {
    const emit = sinon.spy();
    instance = createLibrariesComponent({ strings, libraries: cloneLibraries(), emit });
    instance.setView(LIBRARY_VIEW.EMPTY, { query: 'zzz' });
    instance.element.querySelector('.ax-lib-empty__cta').click();
    expect(emit.calledOnceWith('empty-go-back')).to.be.true;
  });

  it('destroy removes the component from the DOM', () => {
    instance = createLibrariesComponent({ strings, libraries: cloneLibraries() });
    document.body.appendChild(instance.element);
    instance.destroy();
    expect(instance.element.isConnected).to.be.false;
  });
});
