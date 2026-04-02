import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  createColorDataService,
  PALETTE_10_COLORS_MODAL,
} from '../../../../express/code/scripts/color-shared/services/createColorDataService.js';
import { serviceManager } from '../../../../express/code/libs/services/core/ServiceManager.js';

const SAMPLE_THEMES = [
  {
    id: 'theme-1',
    name: 'Eternal Sunshine',
    swatches: [{ hex: 'FFE0FE' }, { hex: 'EDC3FF' }, { hex: 'BCB2FF' }],
    tags: ['sunshine', 'pastel'],
    author: { name: 'test-author' },
  },
  {
    id: 'theme-2',
    name: 'Ocean Depth',
    swatches: [{ hex: '0A1172' }, { hex: '1B2B8C' }, { hex: '2C3FA6' }],
    tags: ['ocean', 'blue'],
    author: { name: 'test-author' },
  },
];

describe('createColorDataService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns provider data for strips', async () => {
    sinon.stub(serviceManager, 'getProvider').resolves({
      exploreThemes: sinon.stub().resolves({ themes: SAMPLE_THEMES }),
    });
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });

    const data = await service.fetchData();

    expect(data).to.be.an('array').with.length(2);
    expect(data[0].name).to.equal('Eternal Sunshine');
    expect(data[0].coreColors).to.deep.equal(['#FFE0FE', '#EDC3FF', '#BCB2FF']);
  });

  it('supports cached reads and explicit refresh paths', async () => {
    const exploreThemes = sinon.stub().resolves({ themes: SAMPLE_THEMES });
    const getProvider = sinon.stub(serviceManager, 'getProvider').resolves({ exploreThemes });
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });

    const first = await service.fetchData();
    const second = await service.fetchData();

    expect(second).to.equal(first);

    const refreshed = await service.fetch({ forceRefresh: true });
    expect(refreshed).to.be.an('array').with.length(2);

    service.clearCache();
    const afterClear = await service.fetchData();
    expect(afterClear).to.be.an('array').with.length(2);
    expect(getProvider.callCount).to.equal(3);
    expect(exploreThemes.callCount).to.equal(3);
  });

  it('supports search and filter over cached data', async () => {
    sinon.stub(serviceManager, 'getProvider').resolves({
      exploreThemes: sinon.stub().resolves({ themes: SAMPLE_THEMES }),
    });
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });
    await service.fetchData();

    const searchResults = await service.search('sunshine');
    const filterResults = service.filter({ type: 'linear' });

    expect(searchResults.length).to.be.greaterThan(0);
    expect(searchResults[0].name.toLowerCase()).to.include('sunshine');
    expect(filterResults.length).to.be.greaterThan(0);
    expect(filterResults.every((item) => item.type === 'linear')).to.equal(true);
  });

  it('returns empty data when provider is unavailable', async () => {
    sinon.stub(serviceManager, 'getProvider').resolves(null);
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });
    const data = await service.fetchData();
    expect(data).to.deep.equal([]);
  });

  it('calls kuler.searchThemes for strips variant', async () => {
    const fakeThemes = [
      {
        id: 'theme-api-1',
        name: 'Ocean Breeze',
        swatches: [
          { values: [0, 0.4, 0.8] },
          { values: [0.1, 0.5, 0.9] },
        ],
        tags: [{ value: 'ocean' }],
      },
    ];
    const fakeKuler = { searchThemes: sinon.stub().resolves({ themes: fakeThemes }) };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'strips' });

    const results = await service.search('ocean');

    expect(fakeKuler.searchThemes.calledOnce).to.equal(true);
    expect(fakeKuler.searchThemes.calledWith('ocean')).to.equal(true);
    expect(results).to.be.an('array').with.length(1);
    expect(results[0].name).to.equal('Ocean Breeze');
  });

  it('calls kuler.searchGradients for gradients variant', async () => {
    const fakeGradients = [
      {
        id: 'gradient-api-1',
        name: 'Sunset Glow',
        gradientSecondaryRepresentation: {
          rendition: {
            type: 'linear',
            angle: 90,
            stops: [
              { color: [{ mode: 'rgb', value: { r: 255, g: 100, b: 50 } }], offset: 0 },
              { color: [{ mode: 'rgb', value: { r: 255, g: 200, b: 100 } }], offset: 1 },
            ],
          },
        },
        tags: [{ value: 'sunset' }],
      },
    ];
    const fakeKuler = { searchGradients: sinon.stub().resolves({ gradients: fakeGradients }) };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'gradients' });

    const results = await service.search('sunset');

    expect(fakeKuler.searchGradients.calledOnce).to.equal(true);
    expect(fakeKuler.searchGradients.calledWith('sunset')).to.equal(true);
    expect(results).to.be.an('array').with.length(1);
    expect(results[0].name).to.equal('Sunset Glow');
  });

  it('falls back to local search when API search fails', async () => {
    const fakeKuler = {
      exploreThemes: sinon.stub().resolves({ themes: SAMPLE_THEMES }),
      searchThemes: sinon.stub().rejects(new Error('Search error')),
    };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'strips' });
    await service.fetchData();

    const results = await service.search('sunshine');
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].name.toLowerCase()).to.include('sunshine');
  });

  it('exposes 10-color modal palette contract', () => {
    expect(PALETTE_10_COLORS_MODAL).to.have.property('id');
    expect(PALETTE_10_COLORS_MODAL).to.have.property('colors');
    expect(PALETTE_10_COLORS_MODAL.colors).to.have.length(10);
  });

  it('searchMore fetches next page when hasNextPage is true', async () => {
    const page1Themes = [
      {
        id: 'theme-p1',
        name: 'Page 1 Theme',
        swatches: [{ values: [0.1, 0.5, 0.9] }],
        tags: [{ value: 'test' }],
      },
    ];
    const page2Themes = [
      {
        id: 'theme-p2',
        name: 'Page 2 Theme',
        swatches: [{ values: [0.2, 0.6, 0.8] }],
        tags: [{ value: 'test' }],
      },
    ];
    const fakeKuler = {
      searchThemes: sinon.stub()
        .onFirstCall().resolves({ themes: page1Themes, hasNextPage: true })
        .onSecondCall()
        .resolves({ themes: page2Themes, hasNextPage: false }),
    };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'strips' });

    const firstPage = await service.search('test');
    expect(firstPage).to.have.length(1);
    expect(firstPage[0].name).to.equal('Page 1 Theme');

    const accumulated = await service.searchMore();
    expect(accumulated).to.have.length(2);
    expect(accumulated[0].name).to.equal('Page 1 Theme');
    expect(accumulated[1].name).to.equal('Page 2 Theme');
    expect(fakeKuler.searchThemes.calledTwice).to.equal(true);
    expect(fakeKuler.searchThemes.secondCall.args[1]).to.have.property('page', 2);
  });

  it('searchMore returns current results when hasNextPage is false', async () => {
    const themes = [
      {
        id: 'theme-only',
        name: 'Only Theme',
        swatches: [{ values: [0.3, 0.5, 0.7] }],
        tags: [{ value: 'single' }],
      },
    ];
    const fakeKuler = {
      searchThemes: sinon.stub().resolves({ themes, hasNextPage: false }),
    };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'strips' });

    await service.search('single');
    const result = await service.searchMore();
    expect(result).to.have.length(1);
    expect(fakeKuler.searchThemes.calledOnce).to.equal(true);
  });

  it('searchMore paginates gradients with searchGradients', async () => {
    const page1 = [
      {
        id: 'grad-p1',
        name: 'Gradient Page 1',
        gradientSecondaryRepresentation: {
          rendition: {
            type: 'linear',
            angle: 90,
            stops: [
              { color: [{ mode: 'rgb', value: { r: 255, g: 0, b: 0 } }], offset: 0 },
              { color: [{ mode: 'rgb', value: { r: 0, g: 0, b: 255 } }], offset: 1 },
            ],
          },
        },
        tags: [{ value: 'grad' }],
      },
    ];
    const page2 = [
      {
        id: 'grad-p2',
        name: 'Gradient Page 2',
        gradientSecondaryRepresentation: {
          rendition: {
            type: 'linear',
            angle: 45,
            stops: [
              { color: [{ mode: 'rgb', value: { r: 0, g: 255, b: 0 } }], offset: 0 },
              { color: [{ mode: 'rgb', value: { r: 255, g: 255, b: 0 } }], offset: 1 },
            ],
          },
        },
        tags: [{ value: 'grad' }],
      },
    ];
    const fakeKuler = {
      searchGradients: sinon.stub()
        .onFirstCall().resolves({ gradients: page1, hasNextPage: true })
        .onSecondCall()
        .resolves({ gradients: page2, hasNextPage: false }),
    };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'gradients' });

    const firstPage = await service.search('grad');
    expect(firstPage).to.have.length(1);

    const accumulated = await service.searchMore();
    expect(accumulated).to.have.length(2);
    expect(accumulated[1].name).to.equal('Gradient Page 2');
    expect(fakeKuler.searchGradients.calledTwice).to.equal(true);
    expect(fakeKuler.searchGradients.secondCall.args[1]).to.have.property('page', 2);
  });

  it('toggleLike calls kuler.updateLike to like an item', async () => {
    const fakeKuler = { updateLike: sinon.stub().resolves() };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'gradients' });

    const result = await service.toggleLike({ id: 'grad-1', liked: true });
    expect(result).to.equal(true);
    expect(fakeKuler.updateLike.calledOnce).to.equal(true);
    expect(fakeKuler.updateLike.firstCall.args[0]).to.deep.equal({
      id: 'grad-1',
      like: null,
      source: 'color-explore',
    });
  });

  it('toggleLike calls kuler.updateLike to unlike an item', async () => {
    const fakeKuler = { updateLike: sinon.stub().resolves() };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({ variant: 'gradients' });

    const result = await service.toggleLike({ id: 'grad-1', liked: false });
    expect(result).to.equal(false);
    expect(fakeKuler.updateLike.calledOnce).to.equal(true);
    expect(fakeKuler.updateLike.firstCall.args[0]).to.deep.equal({
      id: 'grad-1',
      like: { user: true },
      source: 'color-explore',
    });
  });

  it('toggleLike returns liked state when kuler is unavailable', async () => {
    sinon.stub(serviceManager, 'getProvider').resolves(null);

    const service = createColorDataService({ variant: 'gradients' });

    const result = await service.toggleLike({ id: 'grad-1', liked: true });
    expect(result).to.equal(true);
  });
});
