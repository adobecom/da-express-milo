import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import {
  createColorDataService,
  PALETTE_10_COLORS_MODAL,
} from '../../../../express/code/scripts/color-shared/services/createColorDataService.js';

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

    const searchResults = service.search('sunshine');
    const filterResults = service.filter({ category: 'neutral' });

    expect(searchResults.length).to.be.greaterThan(0);
    expect(searchResults[0].name.toLowerCase()).to.include('sunshine');
    expect(filterResults.length).to.be.greaterThan(0);
    expect(filterResults.every((item) => item.category === 'neutral')).to.equal(true);
  });

  it('exposes 10-color modal palette contract', () => {
    expect(PALETTE_10_COLORS_MODAL).to.have.property('id');
    expect(PALETTE_10_COLORS_MODAL).to.have.property('colors');
    expect(PALETTE_10_COLORS_MODAL.colors).to.have.length(10);
  });
});
