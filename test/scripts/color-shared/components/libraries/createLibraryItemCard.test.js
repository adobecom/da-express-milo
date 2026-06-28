/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../../../express/code/scripts/utils.js';
import { createLibraryItemCard } from '../../../../../express/code/scripts/color-shared/components/libraries/createLibraryItemCard.js';
import { createColorLibrariesPlaceholders } from '../../../../../express/code/scripts/color-shared/i18n/loadColorLibrariesPlaceholders.js';

setLibs('/test/mocks/libs', { hostname: 'prod.example.com', search: '' });

const strings = createColorLibrariesPlaceholders();
const library = { id: 'lib-1', name: 'Brand' };
const toolHrefs = {
  contrast: '/create/color-contrast-analyzer',
  colorBlindness: '/create/color-accessibility',
  colorWheel: '/create/color-wheel',
};

describe('createLibraryItemCard', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders theme card with palette strip and accessibility actions', () => {
    const emit = sinon.spy();
    const card = createLibraryItemCard({
      id: 'theme-1',
      type: 'theme',
      name: 'Ocean',
      colors: ['#001122', '#334455'],
      colorBlindSafe: true,
    }, {
      library,
      strings,
      emit,
      toolHrefs,
    });
    document.body.appendChild(card);

    expect(card.classList.contains('ax-lib-card--theme')).to.be.true;
    expect(card.querySelector('.ax-lib-card__name').textContent).to.equal('Ocean');
    expect(card.querySelector('.ax-lib-card__badge').textContent).to.equal(strings.librariesColorBlindBadge);
    expect(card.querySelector('color-palette')).to.exist;
    expect(card.querySelector('.ax-lib-card__action-menu')).to.exist;
  });

  it('renders gradient card with gradient visual and no accessibility menu', () => {
    const card = createLibraryItemCard({
      id: 'grad-1',
      type: 'gradient',
      name: 'Sunset',
      colorStops: [
        { color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }], offset: 0 },
        { color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }], offset: 1 },
      ],
    }, { library, strings, toolHrefs });
    document.body.appendChild(card);

    expect(card.classList.contains('ax-lib-card--gradient')).to.be.true;
    expect(card.querySelector('.ax-lib-card__gradient')).to.exist;
    expect(card.querySelector('.ax-lib-card__subtitle').textContent).to.equal(strings.librariesGradientSubtitle);
  });

  it('sets preview aria-label from theme colors', () => {
    const card = createLibraryItemCard({
      id: 'theme-2',
      type: 'theme',
      name: 'Ocean',
      colors: ['#001122', '#334455'],
    }, { library, strings, toolHrefs });

    const visual = card.querySelector('.ax-lib-card__visual');
    expect(visual.getAttribute('aria-label')).to.include('Ocean');
    expect(visual.getAttribute('aria-label')).to.include('#001122');
  });

  it('emits item-open when preview is activated', () => {
    const emit = sinon.spy();
    const item = {
      id: 'theme-3',
      type: 'theme',
      name: 'Forest',
      colors: ['#00FF00'],
    };
    const card = createLibraryItemCard(item, { library, strings, emit, toolHrefs });
    card.querySelector('.ax-lib-card__visual').click();

    expect(emit.calledOnceWith('item-open', {
      item,
      libraryId: library.id,
      libraryName: library.name,
    })).to.be.true;
  });

  it('emits item-delete when delete action is clicked', () => {
    const emit = sinon.spy();
    const item = {
      id: 'theme-4',
      type: 'theme',
      name: 'Forest',
      colors: ['#00FF00'],
    };
    const card = createLibraryItemCard(item, { library, strings, emit, toolHrefs });
    document.body.appendChild(card);

    const deleteBtn = [...card.querySelectorAll('.ax-lib-card__action')]
      .find((btn) => btn.getAttribute('aria-label')?.includes('Delete'));
    deleteBtn.click();

    expect(emit.calledOnceWith('item-delete', {
      item,
      libraryId: library.id,
      libraryName: library.name,
    })).to.be.true;
  });
});
