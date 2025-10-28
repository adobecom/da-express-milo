import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { fetchAPI } from '../../../../express/code/blocks/search-marquee/utils/autocomplete-api-v3.js';

describe('Autocomplete API v3 Utility Functions', () => {
  let fetchStub;
  let atobStub;

  beforeEach(() => {
    fetchStub = sinon.stub(window, 'fetch');
    atobStub = sinon.stub(window, 'atob').returns('mocked-api-key');
  });

  afterEach(() => {
    fetchStub.restore();
    atobStub.restore();
  });

  it('should fetch API with valid input', async () => {
    fetchStub.returns(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ queryResults: [{ items: [{ title: 'Suggestion 1' }] }] }),
    }));

    const result = await fetchAPI({ textQuery: 'test', locale: 'en-US' });
    expect(fetchStub.calledOnce).to.be.true;
    expect(fetchStub.calledOnceWith('https://adobesearch-atc.adobe.io/uss/v3/autocomplete', {
      method: 'POST',
      headers: {
        'x-api-key': 'mocked-api-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        experienceId: 'default-templates-autocomplete-v1',
        textQuery: 'test',
        locale: 'en-US',
        queries: [{ limit: 5, id: 'default-templates-autocomplete-v1', scope: { entities: ['HzTemplate'] } }],
      }),
    })).to.be.true;
    expect(result).to.deep.equal([{ title: 'Suggestion 1' }]);
  });

  it('should return empty array for empty text query', async () => {
    const result = await fetchAPI({ textQuery: '', locale: 'en-US' });
    expect(fetchStub.called).to.be.false;
    expect(result).to.deep.equal([]);
  });

  it('should return empty array for unsupported locale', async () => {
    const result = await fetchAPI({ textQuery: 'test', locale: 'fr-CA' });
    expect(fetchStub.called).to.be.false;
    expect(result).to.deep.equal([]);
  });

  it('should handle API network error gracefully', async () => {
    fetchStub.returns(Promise.reject(new Error('Network error')));
    const consoleErrorStub = sinon.stub(console, 'error');

    const result = await fetchAPI({ textQuery: 'test', locale: 'en-US' });
    expect(fetchStub.calledOnce).to.be.true;
    expect(result).to.deep.equal([]);
    expect(consoleErrorStub.calledOnceWith('Autocomplete API Error: ', sinon.match.instanceOf(Error))).to.be.true;
    consoleErrorStub.restore();
  });

  it('should handle malformed API response gracefully', async () => {
    fetchStub.returns(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ someOtherData: 'invalid' }),
    }));

    const result = await fetchAPI({ textQuery: 'test', locale: 'en-US' });
    expect(fetchStub.calledOnce).to.be.true;
    expect(result).to.deep.equal([]);
  });

  it('should handle API response with empty queryResults', async () => {
    fetchStub.returns(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ queryResults: [] }),
    }));

    const result = await fetchAPI({ textQuery: 'test', locale: 'en-US' });
    expect(fetchStub.calledOnce).to.be.true;
    expect(result).to.deep.equal([]);
  });

  it('should handle API response with empty items array', async () => {
    fetchStub.returns(Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ queryResults: [{ items: [] }] }),
    }));

    const result = await fetchAPI({ textQuery: 'test', locale: 'en-US' });
    expect(fetchStub.calledOnce).to.be.true;
    expect(result).to.deep.equal([]);
  });
});
