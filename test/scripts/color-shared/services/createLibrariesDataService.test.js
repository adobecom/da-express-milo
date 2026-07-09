import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { serviceManager } from '../../../../express/code/libs/services/index.js';
import {
  fetchLibrariesWithElements,
  deleteLibraryItem,
} from '../../../../express/code/scripts/color-shared/services/createLibrariesDataService.js';
import {
  GRADIENT_ELEMENT_TYPE,
  THEME_ELEMENT_TYPE,
  THEME_REPRESENTATION_TYPE,
} from '../../../../express/code/libs/services/plugins/cclibrary/constants.js';

describe('createLibrariesDataService', () => {
  let fetchUserLibraries;
  let fetchLibraryElements;
  let deleteTheme;
  let lanaLog;

  beforeEach(() => {
    fetchUserLibraries = sinon.stub();
    fetchLibraryElements = sinon.stub();
    deleteTheme = sinon.stub().resolves();
    lanaLog = sinon.stub();
    window.lana = { log: lanaLog };

    sinon.stub(serviceManager, 'init').resolves();
    sinon.stub(serviceManager, 'getProvider').resolves({
      fetchUserLibraries,
      fetchLibraryElements,
      deleteTheme,
    });
  });

  afterEach(() => {
    sinon.restore();
    delete window.lana;
  });

  it('returns empty array when provider is unavailable', async () => {
    serviceManager.getProvider.resolves(null);
    const libraries = await fetchLibrariesWithElements();
    expect(libraries).to.deep.equal([]);
  });

  it('parses theme and gradient elements into library models', async () => {
    fetchUserLibraries.resolves({
      libraries: [{ library_urn: 'urn:lib:1', name: 'Brand' }],
    });
    fetchLibraryElements.resolves({
      elements: [
        {
          id: 'theme-1',
          name: 'Ocean',
          type: THEME_ELEMENT_TYPE,
          representations: [{
            type: THEME_REPRESENTATION_TYPE,
            'colortheme#data': {
              swatches: [
                [{ mode: 'RGB', value: { r: 255, g: 0, b: 0 } }],
                '#00FF00',
              ],
              tags: ['ocean'],
              accessibilityData: { colorBlindSafe: true },
            },
          }],
        },
        {
          id: 'grad-1',
          name: 'Sunset',
          type: GRADIENT_ELEMENT_TYPE,
          representations: [{
            'gradient#data': {
              angle: 45,
              stops: [
                { color: [{ mode: 'RGB', value: { r: 0, g: 0, b: 0 } }], offset: 0 },
              ],
            },
          }],
        },
      ],
    });

    const libraries = await fetchLibrariesWithElements();
    expect(libraries).to.have.lengthOf(1);
    expect(libraries[0].themeCount).to.equal(1);
    expect(libraries[0].gradientCount).to.equal(1);
    expect(libraries[0].items[0]).to.include({
      id: 'theme-1',
      type: 'theme',
      name: 'Ocean',
      colorBlindSafe: true,
    });
    expect(libraries[0].items[0].colors).to.deep.equal(['#ff0000', '#00FF00']);
    expect(libraries[0].items[1]).to.include({
      id: 'grad-1',
      type: 'gradient',
      angle: 45,
    });
  });

  it('filters out libraries with no color content', async () => {
    fetchUserLibraries.resolves({
      libraries: [
        { id: 'empty-lib', name: 'Empty' },
        { id: 'full-lib', name: 'Full' },
      ],
    });
    fetchLibraryElements.onFirstCall().resolves({ elements: [] });
    fetchLibraryElements.onSecondCall().resolves({
      elements: [{
        id: 'theme-1',
        name: 'One',
        type: 'colortheme',
        representations: [{
          'colortheme#data': { swatches: ['#FFFFFF'] },
        }],
      }],
    });

    const libraries = await fetchLibrariesWithElements();
    expect(libraries).to.have.lengthOf(1);
    expect(libraries[0].id).to.equal('full-lib');
  });

  it('falls back to empty items when element fetch fails', async () => {
    fetchUserLibraries.resolves({
      libraries: [{ id: 'lib-1', name: 'Broken' }],
    });
    fetchLibraryElements.rejects(new Error('network'));

    const libraries = await fetchLibrariesWithElements();
    expect(libraries).to.deep.equal([]);
    expect(lanaLog.calledOnce).to.be.true;
  });

  it('deleteLibraryItem validates required ids', async () => {
    try {
      await deleteLibraryItem('', 'element-1');
      expect.fail('Expected deleteLibraryItem to throw');
    } catch (err) {
      expect(err.message).to.equal('Library ID and element ID are required');
    }
  });

  it('deleteLibraryItem calls provider deleteTheme', async () => {
    await deleteLibraryItem('lib-1', 'element-1');
    expect(deleteTheme.calledOnceWith('lib-1', 'element-1', { throwOnError: true })).to.be.true;
  });

  it('deleteLibraryItem throws when provider is unavailable', async () => {
    serviceManager.getProvider.resolves(null);
    try {
      await deleteLibraryItem('lib-1', 'element-1');
      expect.fail('Expected deleteLibraryItem to throw');
    } catch (err) {
      expect(err.message).to.equal('CC Library provider is unavailable');
    }
  });
});
