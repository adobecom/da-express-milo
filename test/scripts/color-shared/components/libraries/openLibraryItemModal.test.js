import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { openLibraryItemModal } from '../../../../../express/code/scripts/color-shared/components/libraries/openLibraryItemModal.js';

describe('openLibraryItemModal', () => {
  let modalManager;

  beforeEach(() => {
    modalManager = {
      open: sinon.stub().resolves(),
      openPaletteSwatchesModal: sinon.stub().resolves(),
      openLibraryGradientModal: sinon.stub().resolves(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns early when item or modalManager is missing', async () => {
    await openLibraryItemModal(null, modalManager);
    await openLibraryItemModal({ type: 'theme', colors: ['#fff'] }, null);
    expect(modalManager.open.called).to.be.false;
    expect(modalManager.openPaletteSwatchesModal.called).to.be.false;
  });

  const gradientItem = () => ({
    id: 'grad-1',
    type: 'gradient',
    name: 'Sunset',
    colorStops: [
      { color: [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }], offset: 0 },
      { color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 255 } }], offset: 1 },
    ],
  });

  it('opens the read-only gradient modal when no CC Library context is available', async () => {
    const item = gradientItem();

    await openLibraryItemModal(item, modalManager, {
      modalStrings: { title: 'Modal' },
      fallbackGradientTitle: 'Gradient',
    });

    expect(modalManager.open.calledOnce).to.be.true;
    expect(modalManager.openLibraryGradientModal.called).to.be.false;
    expect(modalManager.open.firstCall.args[0].title).to.equal('Sunset');
    expect(modalManager.open.firstCall.args[0].content).to.be.a('function');
  });

  it('opens the editable library gradient modal when provider + libraryId are present', async () => {
    const item = gradientItem();
    const ccLibraryProvider = { updateTheme: sinon.stub(), buildGradientPayload: sinon.stub() };

    await openLibraryItemModal(item, modalManager, {
      librariesStrings: { foo: 'bar' },
      libraryId: 'lib-1',
      ccLibraryProvider,
      toolHrefs: { colorWheel: '/x' },
      verticalMaxPerRow: 8,
    });

    expect(modalManager.openLibraryGradientModal.calledOnce).to.be.true;
    expect(modalManager.open.called).to.be.false;
    const [routedItem, routedOptions] = modalManager.openLibraryGradientModal.firstCall.args;
    expect(routedItem).to.equal(item);
    expect(routedOptions).to.include({
      libraryId: 'lib-1',
      ccLibraryProvider,
      verticalMaxPerRow: 8,
    });
  });

  it('opens palette modal for theme items with colors', async () => {
    const item = {
      id: 'theme-1',
      type: 'theme',
      name: 'Ocean',
      colors: ['#001122', '#334455'],
      tags: ['blue'],
    };

    await openLibraryItemModal(item, modalManager, {
      modalStrings: {},
      colorSwatchRailStrings: {},
      verticalMaxPerRow: 8,
    });

    expect(modalManager.openPaletteSwatchesModal.calledOnce).to.be.true;
    expect(modalManager.openPaletteSwatchesModal.firstCall.args[0]).to.equal(item);
    expect(modalManager.openPaletteSwatchesModal.firstCall.args[1]).to.include({
      verticalMaxPerRow: 8,
      showCreator: false,
    });
    const { initialFocusSelector } = modalManager.openPaletteSwatchesModal.firstCall.args[1];
    expect(initialFocusSelector).to.be.a('function');
    const sentinel = {};
    expect(initialFocusSelector(sentinel)).to.equal(sentinel);
  });

  it('does not open palette modal when theme has no colors', async () => {
    await openLibraryItemModal({
      id: 'theme-2',
      type: 'theme',
      name: 'Empty',
      colors: [],
    }, modalManager);

    expect(modalManager.openPaletteSwatchesModal.called).to.be.false;
  });
});
