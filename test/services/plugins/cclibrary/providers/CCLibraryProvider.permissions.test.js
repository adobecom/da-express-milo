/* global globalThis */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CCLibraryProvider from '../../../../../express/code/libs/services/providers/CCLibraryProvider.js';
import CCLibraryPlugin from '../../../../../express/code/libs/services/plugins/cclibrary/CCLibraryPlugin.js';
import {
  LIBRARY_OWNERSHIP,
  LIBRARY_ROLE,
} from '../../../../../express/code/libs/services/plugins/cclibrary/constants.js';

const ACL_DIR_KEY = 'http://ns.adobe.com/adobecloud/rel/directory';

function createTestPlugin(PluginClass, overrides = {}) {
  return new PluginClass({
    serviceConfig: {
      baseUrl: 'https://test.com',
      melvilleBasePath: 'https://libraries.test.io/api/v1',
      apiKey: 'test-key',
      assetAclDirectoryKey: ACL_DIR_KEY,
      endpoints: {
        libraries: '/libraries',
        themes: '/elements',
        metadata: '/metadata',
      },
      ...overrides.serviceConfig,
    },
    appConfig: {
      features: {},
      ...overrides.appConfig,
    },
  });
}

describe('CCLibraryProvider - permissions', () => {
  let plugin;
  let provider;

  beforeEach(() => {
    sinon.stub(globalThis, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    globalThis.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'mock-token' }),
    };

    globalThis.lana = { log: sinon.stub() };

    plugin = createTestPlugin(CCLibraryPlugin);
    provider = new CCLibraryProvider(plugin);
  });

  afterEach(() => {
    sinon.restore();
    delete globalThis.adobeIMS;
    delete globalThis.lana;
  });

  // isLibraryWritable
  describe('isLibraryWritable', () => {
    it('should return false for null', () => {
      expect(provider.isLibraryWritable(null)).to.be.false;
    });

    it('should return false for undefined', () => {
      expect(provider.isLibraryWritable(undefined)).to.be.false;
    });

    it('should return true for private ownership', () => {
      const lib = { ownership: LIBRARY_OWNERSHIP.PRIVATE };
      expect(provider.isLibraryWritable(lib)).to.be.true;
    });

    it('should return true when bookmark role is editor', () => {
      const lib = { ownership: LIBRARY_OWNERSHIP.SHARED, bookmark: { role: LIBRARY_ROLE.EDITOR } };
      expect(provider.isLibraryWritable(lib)).to.be.true;
    });

    it('should return true when asset_acl directory access includes write', () => {
      const lib = {
        ownership: LIBRARY_OWNERSHIP.SHARED,
        asset_acl: { [ACL_DIR_KEY]: ['read', 'write'] },
      };
      expect(provider.isLibraryWritable(lib)).to.be.true;
    });

    it('should return false for shared ownership with viewer role', () => {
      const lib = { ownership: LIBRARY_OWNERSHIP.SHARED, bookmark: { role: LIBRARY_ROLE.VIEWER } };
      expect(provider.isLibraryWritable(lib)).to.be.false;
    });

    it('should return false for shared ownership with no bookmark or acl', () => {
      const lib = { ownership: LIBRARY_OWNERSHIP.SHARED };
      expect(provider.isLibraryWritable(lib)).to.be.false;
    });

    it('should return false when asset_acl directory access has only read', () => {
      const lib = {
        ownership: LIBRARY_OWNERSHIP.SHARED,
        asset_acl: { [ACL_DIR_KEY]: ['read'] },
      };
      expect(provider.isLibraryWritable(lib)).to.be.false;
    });

    it('should return false for an empty object', () => {
      expect(provider.isLibraryWritable({})).to.be.false;
    });
  });

  // filterWritableLibraries
  describe('filterWritableLibraries', () => {
    it('should return empty array for null input', () => {
      expect(provider.filterWritableLibraries(null)).to.deep.equal([]);
    });

    it('should return empty array for undefined input', () => {
      expect(provider.filterWritableLibraries(undefined)).to.deep.equal([]);
    });

    it('should return empty array for non-array input', () => {
      expect(provider.filterWritableLibraries('not-an-array')).to.deep.equal([]);
    });

    it('should return empty array when no libraries are writable', () => {
      const libraries = [
        { id: 'lib-1', ownership: LIBRARY_OWNERSHIP.SHARED, bookmark: { role: LIBRARY_ROLE.VIEWER } },
        { id: 'lib-2', ownership: LIBRARY_OWNERSHIP.SHARED },
      ];
      expect(provider.filterWritableLibraries(libraries)).to.deep.equal([]);
    });

    it('should return only writable libraries', () => {
      const writable = { id: 'lib-1', ownership: LIBRARY_OWNERSHIP.PRIVATE };
      const readOnly = { id: 'lib-2', ownership: LIBRARY_OWNERSHIP.SHARED, bookmark: { role: LIBRARY_ROLE.VIEWER } };
      const editable = { id: 'lib-3', ownership: LIBRARY_OWNERSHIP.SHARED, bookmark: { role: LIBRARY_ROLE.EDITOR } };

      const result = provider.filterWritableLibraries([writable, readOnly, editable]);
      expect(result).to.have.lengthOf(2);
      expect(result[0].id).to.equal('lib-1');
      expect(result[1].id).to.equal('lib-3');
    });

    it('should return all libraries when all are writable', () => {
      const libraries = [
        { id: 'lib-1', ownership: LIBRARY_OWNERSHIP.PRIVATE },
        { id: 'lib-2', ownership: LIBRARY_OWNERSHIP.PRIVATE },
      ];
      expect(provider.filterWritableLibraries(libraries)).to.have.lengthOf(2);
    });

    it('should handle empty array', () => {
      expect(provider.filterWritableLibraries([])).to.deep.equal([]);
    });
  });
});
