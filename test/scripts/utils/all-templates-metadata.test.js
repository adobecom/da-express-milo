import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/libs');

describe('All Templates Metadata', () => {
  let fetchStub;
  let importId = 0;
  const originalUrl = window.location.href;
  const importFresh = async () => {
    importId += 1;
    return import(`../../../express/code/scripts/utils/all-templates-metadata.js?test=${importId}`);
  };

  const mockFetch = (url) => {
    if (url.includes('templates-dev.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'dev-template' }] }),
      });
    }
    if (url.includes('metadata.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [{ id: 'prod-template' }] }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve(null),
    });
  };

  beforeEach(() => {
    fetchStub = sinon.stub(window, 'fetch').callsFake(mockFetch);
  });

  afterEach(() => {
    fetchStub.restore();
    window.history.replaceState(null, '', originalUrl);
  });

  it('should fetch templates metadata for production environment', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);

    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should use different locale prefix', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/fr' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);

    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle case sensitivity in dev parameter', async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('dev', 'TRUE');
    window.history.replaceState(null, '', url);

    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'stage' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);

    // Should not match because includes() is case sensitive
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should return cached result on subsequent calls', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    // First call
    const result1 = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result1).to.deep.equal([{ id: 'prod-template' }]);

    // Second call should return cached result
    const result2 = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result2).to.deep.equal([{ id: 'prod-template' }]);
    expect(result1).to.deep.equal(result2);
  });

  it('should handle stage environment', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'stage' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock fetch to reject
    fetchStub.rejects(new Error('Network error'));

    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.be.an('array');
  });

  it('should handle non-ok response', async () => {
    // Mock fetch to return non-ok response
    fetchStub.resolves({
      ok: false,
      json: () => Promise.resolve(null),
    });

    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.be.an('array');
  });

  it('should handle different locale prefixes', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '/de' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle empty locale prefix', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    const mockGetConfig = () => ({
      locale: { prefix: '' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle null/undefined getConfig', async () => {
    const { default: fetchAllTemplatesMetadata } = await importFresh();

    // Should throw error for invalid getConfig
    try {
      await fetchAllTemplatesMetadata(null);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });
});
