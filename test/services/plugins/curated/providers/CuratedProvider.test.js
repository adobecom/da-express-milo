/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CuratedProvider, { createCuratedProvider } from '../../../../../express/code/libs/services/providers/CuratedProvider.js';
import { ValidationError } from '../../../../../express/code/libs/services/core/Errors.js';
import { CuratedActionGroups, CuratedTopics } from '../../../../../express/code/libs/services/plugins/curated/topics.js';

const mockCuratedData = { files: [{ source: 'BEHANCE', name: 'Theme 1' }] };

describe('CuratedProvider', () => {
  let plugin;
  let provider;
  let actions;

  beforeEach(() => {
    actions = {
      fetchCuratedData: sinon.stub().resolves(mockCuratedData),
      fetchBySource: sinon.stub().resolves({ themes: [{ source: 'BEHANCE', name: 'Theme 1' }] }),
      fetchGroupedBySource: sinon.stub().resolves({
        behance: { themes: [{ source: 'BEHANCE' }] },
        kuler: { themes: [] },
        stock: { themes: [] },
        gradients: { themes: [] },
      }),
    };

    plugin = {
      constructor: { serviceName: 'Curated' },
      useAction: sinon.stub().callsFake((groupName, topic) => {
        if (groupName !== CuratedActionGroups.DATA) {
          return undefined;
        }

        if (topic === CuratedTopics.DATA.FETCH) return actions.fetchCuratedData;
        if (topic === CuratedTopics.DATA.FETCH_BY_SOURCE) return actions.fetchBySource;
        if (topic === CuratedTopics.DATA.FETCH_GROUPED_BY_SOURCE) return actions.fetchGroupedBySource;
        return undefined;
      }),
    };

    provider = new CuratedProvider(plugin);
  });

  afterEach(() => sinon.restore());

  describe('delegation wiring', () => {
    it('initializes action bindings using useAction', () => {
      expect(plugin.useAction.calledThrice).to.be.true;
      expect(plugin.useAction.firstCall.args).to.deep.equal([
        CuratedActionGroups.DATA,
        CuratedTopics.DATA.FETCH,
      ]);
      expect(plugin.useAction.secondCall.args).to.deep.equal([
        CuratedActionGroups.DATA,
        CuratedTopics.DATA.FETCH_BY_SOURCE,
      ]);
      expect(plugin.useAction.thirdCall.args).to.deep.equal([
        CuratedActionGroups.DATA,
        CuratedTopics.DATA.FETCH_GROUPED_BY_SOURCE,
      ]);
    });

    it('fetchCuratedData returns full data from plugin', async () => {
      const result = await provider.fetchCuratedData();
      expect(result).to.deep.equal(mockCuratedData);
      expect(actions.fetchCuratedData.calledOnce).to.be.true;
    });

    it('fetchBySource passes source arg and returns filtered result', async () => {
      const result = await provider.fetchBySource('BEHANCE');
      expect(actions.fetchBySource.calledOnceWithExactly('BEHANCE')).to.be.true;
      expect(result.themes).to.have.lengthOf(1);
      expect(result.themes[0].source).to.equal('BEHANCE');
    });

    it('fetchGroupedBySource returns grouped result with all keys', async () => {
      const result = await provider.fetchGroupedBySource();
      expect(actions.fetchGroupedBySource.calledOnce).to.be.true;
      expect(result).to.have.all.keys('behance', 'kuler', 'stock', 'gradients');
      expect(result.behance.themes).to.have.lengthOf(1);
      expect(result.kuler.themes).to.have.lengthOf(0);
      expect(result.stock.themes).to.have.lengthOf(0);
      expect(result.gradients.themes).to.have.lengthOf(0);
    });
  });

  // ── Error boundary: safeExecute must never throw ───────────
  describe('error boundary (safeExecute)', () => {
    it('fetchCuratedData returns null when action throws', async () => {
      actions.fetchCuratedData.rejects(new Error('CDN down'));
      const result = await provider.fetchCuratedData();
      expect(result).to.be.null;
    });

    it('fetchBySource returns null for invalid source (ValidationError caught)', async () => {
      actions.fetchBySource.rejects(new ValidationError('Invalid source', {
        field: 'source',
        serviceName: 'Curated',
        topic: CuratedTopics.DATA.FETCH_BY_SOURCE,
      }));
      const result = await provider.fetchBySource('GARBAGE');
      expect(result).to.be.null;
    });

    it('fetchGroupedBySource returns null when action throws', async () => {
      actions.fetchGroupedBySource.rejects(new Error('Timeout'));
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
