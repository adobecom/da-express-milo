import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  createColorDataService,
  PALETTE_10_COLORS_MODAL,
} from '../../../../express/code/scripts/color-shared/services/createColorDataService.js';
import { serviceManager } from '../../../../express/code/libs/services/core/ServiceManager.js';

describe('createColorDataService', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns deterministic mock strip data when apiEndpoint is missing', async () => {
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });

    const data = await service.fetchData();

    expect(data).to.be.an('array').with.length(24);
    expect(data[0].name).to.equal('Eternal Sunshine of the Spotless Mind');
    expect(data[0].colors).to.deep.equal(['#FFE0FE', '#EDC3FF', '#BCB2FF', '#ACAAED', '#B3BBED']);
  });

  it('supports cached reads and explicit refresh paths', async () => {
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });

    const first = await service.fetchData();
    const second = await service.fetchData();

    expect(second).to.equal(first);

    const refreshed = await service.fetch({ forceRefresh: true });
    expect(refreshed).to.be.an('array').with.length(24);

    service.clearCache();
    const afterClear = await service.fetchData();
    expect(afterClear).to.be.an('array').with.length(24);
  });

  it('supports search and filter over cached data', async () => {
    const service = createColorDataService({ variant: 'strips', initialLoad: 24, maxItems: 100 });
    await service.fetchData();

    const searchResults = await service.search('sunshine');
    const filterResults = service.filter({ category: 'neutral' });

    expect(searchResults.length).to.be.greaterThan(0);
    expect(searchResults[0].name.toLowerCase()).to.include('sunshine');
    expect(filterResults.length).to.be.greaterThan(0);
    expect(filterResults.every((item) => item.category === 'neutral')).to.equal(true);
  });

  it('calls kuler.searchThemes when not in mock mode for strips variant', async () => {
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

    const service = createColorDataService({
      variant: 'strips',
      useMockData: false,
      useMockFallback: false,
    });

    const results = await service.search('ocean');

    expect(fakeKuler.searchThemes.calledOnce).to.equal(true);
    expect(fakeKuler.searchThemes.calledWith('ocean')).to.equal(true);
    expect(results).to.be.an('array').with.length(1);
    expect(results[0].name).to.equal('Ocean Breeze');
  });

  it('calls kuler.searchGradients when not in mock mode for gradients variant', async () => {
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

    const service = createColorDataService({
      variant: 'gradients',
      useMockData: false,
      useMockFallback: false,
    });

    const results = await service.search('sunset');

    expect(fakeKuler.searchGradients.calledOnce).to.equal(true);
    expect(fakeKuler.searchGradients.calledWith('sunset')).to.equal(true);
    expect(results).to.be.an('array').with.length(1);
    expect(results[0].name).to.equal('Sunset Glow');
  });

  it('calls kuler search API even when useMockData is true (useApiSearch default)', async () => {
    const fakeThemes = [
      {
        id: 'theme-mock-override',
        name: 'Mock Override Theme',
        swatches: [{ values: [0.5, 0.5, 0.5] }],
        tags: [{ value: 'override' }],
      },
    ];
    const fakeKuler = { searchThemes: sinon.stub().resolves({ themes: fakeThemes }) };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({
      variant: 'strips',
      useMockData: true,
      useMockFallback: true,
    });

    const results = await service.search('override');

    expect(fakeKuler.searchThemes.calledOnce).to.equal(true);
    expect(results).to.be.an('array').with.length(1);
    expect(results[0].name).to.equal('Mock Override Theme');
  });

  it('uses local search when useApiSearch is false and in mock mode', async () => {
    const fakeKuler = { searchThemes: sinon.stub().resolves({ themes: [] }) };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({
      variant: 'strips',
      useMockData: true,
      useMockFallback: true,
      useApiSearch: false,
    });
    await service.fetchData();

    const results = await service.search('sunshine');

    expect(fakeKuler.searchThemes.called).to.equal(false);
    expect(results.length).to.be.greaterThan(0);
    expect(results[0].name.toLowerCase()).to.include('sunshine');
  });

  it('falls back to local search when kuler API fails', async () => {
    sinon.stub(serviceManager, 'getProvider').rejects(new Error('Network error'));

    const service = createColorDataService({
      variant: 'strips',
      useMockData: false,
      useMockFallback: true,
    });
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
        .onSecondCall().resolves({ themes: page2Themes, hasNextPage: false }),
    };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({
      variant: 'strips',
      useMockData: false,
      useMockFallback: false,
    });

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

    const service = createColorDataService({
      variant: 'strips',
      useMockData: false,
      useMockFallback: false,
    });

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
        .onSecondCall().resolves({ gradients: page2, hasNextPage: false }),
    };
    sinon.stub(serviceManager, 'getProvider').resolves(fakeKuler);

    const service = createColorDataService({
      variant: 'gradients',
      useMockData: false,
      useMockFallback: false,
    });

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

    const service = createColorDataService({
      variant: 'gradients',
      useMockData: false,
      useMockFallback: false,
    });

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

    const service = createColorDataService({
      variant: 'gradients',
      useMockData: false,
      useMockFallback: false,
    });

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

    const service = createColorDataService({
      variant: 'gradients',
      useMockData: false,
      useMockFallback: false,
    });

    const result = await service.toggleLike({ id: 'grad-1', liked: true });
    expect(result).to.equal(true);
  });

  it('includes requested marquee tags in mock palette and gradient datasets', async () => {
    const expectedTags = [
      'Summer',
      'Neutral Palette',
      'Primary colors',
      'Vaporwave',
      'Spring',
      'Neutral Vintage',
      'Synthwave',
      'Happy',
      'Luxury',
      'Travel',
    ];

    const paletteService = createColorDataService({ variant: 'palettes', initialLoad: 24, maxItems: 100 });
    const gradientService = createColorDataService({ variant: 'gradients', initialLoad: 24, maxItems: 100 });

    const palettes = await paletteService.fetchData();
    const gradients = await gradientService.fetchData();

    expectedTags.forEach((tag) => {
      expect(palettes.some((item) => item.tags?.includes(tag))).to.equal(true);
      expect(gradients.some((item) => item.tags?.includes(tag))).to.equal(true);
    });
  });
});
