/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import CuratedPlugin from '../../../../../express/code/libs/services/plugins/curated/CuratedPlugin.js';

describe('CuratedPlugin', () => {
  let plugin;

  beforeEach(() => {
    plugin = new CuratedPlugin({
      serviceConfig: { baseUrl: 'https://test.example.com/curatedData.json' },
      appConfig: { features: {} },
    });
  });

  // ── Feature flag gating ────────────────────────────────────
  describe('isActivated (feature flag)', () => {
    [
      { label: 'ENABLE_CURATED not set', config: { features: {} }, expected: true },
      { label: 'ENABLE_CURATED is true', config: { features: { ENABLE_CURATED: true } }, expected: true },
      { label: 'ENABLE_CURATED is explicitly false', config: { features: { ENABLE_CURATED: false } }, expected: false },
      { label: 'no features key', config: {}, expected: true },
    ].forEach(({ label, config, expected }) => {
      it(`should return ${expected} when ${label}`, () => {
        expect(plugin.isActivated(config)).to.equal(expected);
      });
    });
  });
});
