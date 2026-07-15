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
      openLibraryThemeModal: sinon.stub().resolves(),
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns early when item or modalManager is missing', async () => {
    await openLibraryItemModal(null, modalManager);
    await openLibraryItemModal({ type: 'theme', colors: ['#fff'] }, null);
    expect(modalManager.open.called).to.be.false;
    expect(modalManager.openLibraryThemeModal.called).to.be.false;
    expect(modalManager.openLibraryGradientModal.called).to.be.false;
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

  it('does not open any modal when CC Library context is missing', async () => {
    await openLibraryItemModal(gradientItem(), modalManager);
    await openLibraryItemModal({
      id: 'theme-1', type: 'theme', name: 'Ocean', colors: ['#001122'],
    }, modalManager);

    expect(modalManager.open.called).to.be.false;
    expect(modalManager.openLibraryGradientModal.called).to.be.false;
    expect(modalManager.openLibraryThemeModal.called).to.be.false;
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

  it('opens the editable library theme modal for theme items with colors', async () => {
    const item = {
      id: 'theme-1',
      type: 'theme',
      name: 'Ocean',
      colors: ['#001122', '#334455'],
      tags: ['blue'],
    };
    const ccLibraryProvider = { updateTheme: sinon.stub() };

    await openLibraryItemModal(item, modalManager, {
      colorSwatchRailStrings: {},
      libraryId: 'lib-1',
      ccLibraryProvider,
      verticalMaxPerRow: 8,
    });

    expect(modalManager.openLibraryThemeModal.calledOnce).to.be.true;
    expect(modalManager.openLibraryThemeModal.firstCall.args[0]).to.equal(item);
    expect(modalManager.openLibraryThemeModal.firstCall.args[1]).to.include({
      libraryId: 'lib-1',
      ccLibraryProvider,
      verticalMaxPerRow: 8,
    });
  });

  it('does not open theme modal when theme has no colors', async () => {
    await openLibraryItemModal({
      id: 'theme-2',
      type: 'theme',
      name: 'Empty',
      colors: [],
    }, modalManager, {
      libraryId: 'lib-1',
      ccLibraryProvider: { updateTheme: sinon.stub() },
    });

    expect(modalManager.openLibraryThemeModal.called).to.be.false;
  });
});
