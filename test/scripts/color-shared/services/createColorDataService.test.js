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

    const searchResults = service.search('sunshine');
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

  it('exposes 10-color modal palette contract', () => {
    expect(PALETTE_10_COLORS_MODAL).to.have.property('id');
    expect(PALETTE_10_COLORS_MODAL).to.have.property('colors');
    expect(PALETTE_10_COLORS_MODAL.colors).to.have.length(10);
  });
});
