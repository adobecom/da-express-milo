/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import CuratedDataActions from '../../../../../express/code/libs/services/plugins/curated/actions/CuratedDataActions.js';
import { CuratedSources, CuratedTopics } from '../../../../../express/code/libs/services/plugins/curated/topics.js';
import { ValidationError } from '../../../../../express/code/libs/services/core/Errors.js';

const mockCuratedData = {
  files: [
    { source: 'BEHANCE', name: 'Behance Theme 1' },
    { source: 'BEHANCE', name: 'Behance Theme 2' },
    { source: 'KULER', name: 'Kuler Theme 1' },
    { source: 'STOCK', name: 'Stock Theme 1' },
    { source: 'STOCK', name: 'Stock Theme 2' },
    { source: 'COLOR_GRADIENTS', name: 'Gradient Theme 1' },
  ],
};

/**
 * Helper: assert that `fn` throws a ValidationError, then run optional extra checks.
 */
async function expectValidationError(fn, extraAssertions = () => {}) {
  try {
    await fn();
    expect.fail('Should have thrown');
  } catch (err) {
    expect(err).to.be.instanceOf(ValidationError);
    extraAssertions(err);
  }
}

describe('CuratedDataActions', () => {
  let actions;
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = { get: sinon.stub().resolves(mockCuratedData) };
    actions = new CuratedDataActions(mockPlugin);
  });

  afterEach(() => sinon.restore());

  // ── getHandlers: structural correctness ──────────────────────
  describe('getHandlers - action routing', () => {
    it('should return a handler for every CuratedTopics.DATA topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(CuratedTopics.DATA);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(CuratedTopics.DATA);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
      handlerKeys.forEach((key) => {
        expect(expectedTopics).to.include(key);
      });
    });
  });

  // ── fetchCuratedData ─────────────────────────────────────────
  describe('fetchCuratedData', () => {
    it('should return full data from plugin', async () => {
      const result = await actions.fetchCuratedData();
      expect(result).to.deep.equal(mockCuratedData);
      expect(mockPlugin.get.calledOnce).to.be.true;
    });
  });

  // ── fetchBySource: validation ──────────────────────────────
  describe('fetchBySource - validation', () => {
    [
      { label: 'completely invalid source', input: 'INVALID' },
      { label: 'empty string', input: '' },
      { label: 'lowercase variant of valid source', input: 'behance' },
    ].forEach(({ label, input }) => {
      it(`should throw ValidationError for ${label}`, async () => {
        await expectValidationError(() => actions.fetchBySource(input));
      });
    });

    it('should include the invalid value and valid sources in the error message', async () => {
      await expectValidationError(
        () => actions.fetchBySource('NOPE'),
        (err) => {
          expect(err.message).to.include('NOPE');
          Object.values(CuratedSources).forEach((src) => {
            expect(err.message).to.include(src);
          });
        },
      );
    });

    it('should set correct error metadata on ValidationError', async () => {
      await expectValidationError(
        () => actions.fetchBySource('BAD'),
        (err) => {
          expect(err.field).to.equal('source');
          expect(err.serviceName).to.equal('Curated');
          expect(err.topic).to.equal(CuratedTopics.DATA.FETCH_BY_SOURCE);
        },
      );
    });

    it('should NOT throw for every valid CuratedSources value', async () => {
      for (const source of Object.values(CuratedSources)) {
        // eslint-disable-next-line no-await-in-loop
        const result = await actions.fetchBySource(source);
        expect(result).to.have.property('themes').that.is.an('array');
      }
    });
  });

  // ── fetchBySource: filtering correctness ───────────────────
  describe('fetchBySource - filtering correctness', () => {
    [
      { source: CuratedSources.BEHANCE, rawKey: 'BEHANCE', expectedCount: 2 },
      { source: CuratedSources.STOCK, rawKey: 'STOCK', expectedCount: 2 },
      { source: CuratedSources.KULER, rawKey: 'KULER', expectedCount: 1 },
      { source: CuratedSources.COLOR_GRADIENTS, rawKey: 'COLOR_GRADIENTS', expectedCount: 1 },
    ].forEach(({ source, rawKey, expectedCount }) => {
      it(`should return only ${rawKey} themes (${expectedCount}) when filtered`, async () => {
        const result = await actions.fetchBySource(source);
        expect(result.themes).to.have.lengthOf(expectedCount);
        result.themes.forEach((t) => expect(t.source).to.equal(rawKey));
      });
    });

    it('should return empty themes when source has no matches in data', async () => {
      mockPlugin.get.resolves({ files: [{ source: 'KULER', name: 'Only Kuler' }] });
      const result = await actions.fetchBySource(CuratedSources.BEHANCE);
      expect(result.themes).to.deep.equal([]);
    });
  });

  // ── fetchBySource: defensive data handling ─────────────────
  describe('fetchBySource - malformed API responses', () => {
    [
      { label: 'null', data: null },
      { label: 'empty object', data: {} },
      { label: 'null files', data: { files: null } },
    ].forEach(({ label, data }) => {
      it(`should return empty themes when API returns ${label}`, async () => {
        mockPlugin.get.resolves(data);
        const result = await actions.fetchBySource(CuratedSources.BEHANCE);
        expect(result.themes).to.deep.equal([]);
      });
    });
  });

  // ── fetchGroupedBySource: grouping correctness ─────────────
  describe('fetchGroupedBySource - grouping', () => {
    it('should bucket all items into the correct groups', async () => {
      const result = await actions.fetchGroupedBySource();
      expect(result.behance.themes).to.have.lengthOf(2);
      expect(result.kuler.themes).to.have.lengthOf(1);
      expect(result.stock.themes).to.have.lengthOf(2);
      expect(result.gradients.themes).to.have.lengthOf(1);
    });

    it('should not leak items between groups', async () => {
      const result = await actions.fetchGroupedBySource();
      result.behance.themes.forEach((t) => expect(t.source).to.equal('BEHANCE'));
      result.kuler.themes.forEach((t) => expect(t.source).to.equal('KULER'));
      result.stock.themes.forEach((t) => expect(t.source).to.equal('STOCK'));
      result.gradients.themes.forEach((t) => expect(t.source).to.equal('COLOR_GRADIENTS'));
    });

    [
      { label: 'empty files array', data: { files: [] } },
      { label: 'missing files property', data: {} },
    ].forEach(({ label, data }) => {
      it(`should return all four group keys with empty themes for ${label}`, async () => {
        mockPlugin.get.resolves(data);
        const result = await actions.fetchGroupedBySource();
        expect(result).to.have.all.keys('behance', 'kuler', 'stock', 'gradients');
        Object.values(result).forEach((group) => {
          expect(group.themes).to.deep.equal([]);
        });
      });
    });
  });
});
