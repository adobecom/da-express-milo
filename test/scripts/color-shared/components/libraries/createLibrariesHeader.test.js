/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../../express/code/scripts/utils.js';
import {
  createLibrariesHeader,
  LIBRARY_SORT,
} from '../../../../../express/code/scripts/color-shared/components/libraries/createLibrariesHeader.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const strings = createColorLibrariesPlaceholders();

describe('createLibrariesHeader', () => {
  let instance;

  afterEach(() => {
    instance?.destroy?.();
    instance = null;
    sinon.restore();
    document.body.innerHTML = '';
  });

  it('returns header element with count and sort menu options', () => {
    instance = createLibrariesHeader({ strings });
    document.body.appendChild(instance.element);

    expect(instance.element.classList.contains('ax-lib-header')).to.be.true;
    expect(instance.element.querySelector('.ax-lib-header__count')).to.exist;
    expect(instance.element.querySelectorAll('sp-menu-item')).to.have.lengthOf(2);
  });

  it('setCount updates the saved libraries heading', () => {
    instance = createLibrariesHeader({ strings });
    instance.setCount(2);
    expect(instance.element.querySelector('.ax-lib-header__count').textContent).to.equal('2 saved libraries');
  });

  it('defaults sort to last modified', () => {
    instance = createLibrariesHeader({ strings });
    expect(instance.getSort()).to.equal(LIBRARY_SORT.LAST_MODIFIED);
  });

  it('emits sort-change when a menu item is selected', () => {
    const emit = sinon.spy();
    instance = createLibrariesHeader({ strings, emit });
    document.body.appendChild(instance.element);

    const nameItem = instance.element.querySelector('sp-menu-item[value="name"]');
    nameItem.click();

    expect(emit.calledOnceWith('sort-change', { key: LIBRARY_SORT.NAME })).to.be.true;
    expect(instance.getSort()).to.equal(LIBRARY_SORT.NAME);
  });

  it('setSort updates sort silently without emitting', () => {
    const emit = sinon.spy();
    instance = createLibrariesHeader({ strings, emit });
    instance.setSort(LIBRARY_SORT.NAME);

    expect(instance.getSort()).to.equal(LIBRARY_SORT.NAME);
    expect(emit.called).to.be.false;
  });

  it('renders sort heading from placeholders', () => {
    instance = createLibrariesHeader({ strings });
    const heading = instance.element.querySelector('.ax-lib-header__sort-heading');
    expect(heading.textContent).to.equal(strings.librariesSortHeading);
  });
});
