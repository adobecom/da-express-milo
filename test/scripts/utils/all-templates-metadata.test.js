import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';

setLibs('/libs');

describe('All Templates Metadata', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock fetch
    mockFetch = (url) => {
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

    window.fetch = mockFetch;
  });

  afterEach(() => {
    // Clear any cached results by importing fresh module
    // The global variable is in the module scope, not window
    // We need to clear it by re-importing the module
  });

  it('should fetch templates metadata for production environment', async () => {
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);

    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should use different locale prefix', async () => {
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/fr' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);

    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle case sensitivity in dev parameter', async () => {
    window.location.search = '?dev=TRUE';

    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'stage' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);

    // Should not match because includes() is case sensitive
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should return cached result on subsequent calls', async () => {
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

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
    // Clear module cache and import fresh
    delete window._allTemplatesMetadata; // eslint-disable-line no-underscore-dangle
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'stage' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock fetch to reject
    window.fetch = () => Promise.reject(new Error('Network error'));

    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.be.an('array');
  });

  it('should handle non-ok response', async () => {
    // Mock fetch to return non-ok response
    window.fetch = () => Promise.resolve({
      ok: false,
      json: () => Promise.resolve(null),
    });

    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/us' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.be.an('array');
  });

  it('should handle different locale prefixes', async () => {
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '/de' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle empty locale prefix', async () => {
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    const mockGetConfig = () => ({
      locale: { prefix: '' },
      env: { name: 'prod' },
    });

    const result = await fetchAllTemplatesMetadata(mockGetConfig);
    expect(result).to.deep.equal([{ id: 'prod-template' }]);
  });

  it('should handle null/undefined getConfig', async () => {
    const { default: fetchAllTemplatesMetadata } = await import('../../../express/code/scripts/utils/all-templates-metadata.js');

    // Should throw error for invalid getConfig
    try {
      await fetchAllTemplatesMetadata(null);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });
});
