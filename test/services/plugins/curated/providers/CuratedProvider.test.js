/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CuratedProvider, { createCuratedProvider } from '../../../../express/code/libs/services/providers/CuratedProvider.js';
import CuratedPlugin from '../../../../express/code/libs/services/plugins/curated/CuratedPlugin.js';

const mockCuratedData = {
  files: [
    { source: 'BEHANCE', name: 'Theme 1' },
    { source: 'KULER', name: 'Theme 2' },
    { source: 'STOCK', name: 'Theme 3' },
    { source: 'COLOR_GRADIENTS', name: 'Theme 4' },
  ],
};

describe('CuratedProvider', () => {
  let plugin;
  let provider;

  beforeEach(() => {
    plugin = new CuratedPlugin({
      serviceConfig: { baseUrl: 'https://test.example.com/curatedData.json' },
      appConfig: { features: {} },
    });
    sinon.stub(plugin, 'get').resolves(mockCuratedData);
    provider = new CuratedProvider(plugin);
  });

  afterEach(() => sinon.restore());

  // ── End-to-end: actions wire through correctly ─────────────
  describe('action wiring', () => {
    it('fetchCuratedData returns full data from plugin', async () => {
      const result = await provider.fetchCuratedData();
      expect(result).to.deep.equal(mockCuratedData);
      expect(plugin.get.calledOnce).to.be.true;
    });

    it('fetchBySource passes source arg and returns filtered result', async () => {
      const result = await provider.fetchBySource('BEHANCE');
      expect(result.themes).to.have.lengthOf(1);
      expect(result.themes[0].source).to.equal('BEHANCE');
    });

    it('fetchGroupedBySource returns grouped result with all keys', async () => {
      const result = await provider.fetchGroupedBySource();
      expect(result).to.have.all.keys('behance', 'kuler', 'stock', 'gradients');
      Object.values(result).forEach((group) => {
        expect(group.themes).to.have.lengthOf(1);
      });
    });
  });

  // ── Error boundary: safeExecute must never throw ───────────
  describe('error boundary (safeExecute)', () => {
    it('fetchCuratedData returns null when plugin throws', async () => {
      plugin.get.rejects(new Error('CDN down'));
      const result = await provider.fetchCuratedData();
      expect(result).to.be.null;
    });

    it('fetchBySource returns null for invalid source (ValidationError caught)', async () => {
      const result = await provider.fetchBySource('GARBAGE');
      expect(result).to.be.null;
    });

    it('fetchGroupedBySource returns null when plugin throws', async () => {
      plugin.get.rejects(new Error('Timeout'));
      const result = await provider.fetchGroupedBySource();
      expect(result).to.be.null;
    });
  });

  // ── Factory function ───────────────────────────────────────
  describe('createCuratedProvider factory', () => {
    it('should return a CuratedProvider instance', () => {
      const instance = createCuratedProvider(plugin);
      expect(instance).to.be.instanceOf(CuratedProvider);
    });
  });
});
