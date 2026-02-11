import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { LikeActions } from '../../../../express/code/libs/services/plugins/kuler/actions/KulerActions.js';
import { KulerTopics } from '../../../../express/code/libs/services/plugins/kuler/topics.js';
import { expectValidationError, createMockPlugin, stubFetch } from './helpers.js';

describe('LikeActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    actions = new LikeActions(mockPlugin);
    fetchStub = stubFetch({});
  });

  afterEach(() => sinon.restore());

  // ─── getHandlers ──────────────────────────────────────────────────────

  describe('getHandlers', () => {
    it('should map KulerTopics.LIKE.UPDATE to a function', () => {
      const handlers = actions.getHandlers();
      expect(handlers).to.have.property(KulerTopics.LIKE.UPDATE).that.is.a('function');
    });

    it('should have exactly 1 handler', () => {
      expect(Object.keys(actions.getHandlers())).to.have.lengthOf(1);
    });
  });

  // ─── URL Builders ─────────────────────────────────────────────────────

  describe('buildThemeLikeUrl', () => {
    it('should build like URL with /likeDuplicate suffix', () => {
      expect(actions.buildThemeLikeUrl('t-1')).to.equal(
        'https://asset.test.io/themes/t-1/likeDuplicate',
      );
    });

    it('should fall back to defaults when endpoints are empty', () => {
      mockPlugin.endpoints = {};
      expect(actions.buildThemeLikeUrl('t-1')).to.equal(
        'https://asset.adobe.io/themes/t-1/likeDuplicate',
      );
    });
  });

  describe('buildThemeUnlikeUrl', () => {
    it('should build unlike URL with /like suffix', () => {
      expect(actions.buildThemeUnlikeUrl('t-1')).to.equal(
        'https://asset.test.io/themes/t-1/like',
      );
    });

    it('should fall back to defaults when endpoints are empty', () => {
      mockPlugin.endpoints = {};
      expect(actions.buildThemeUnlikeUrl('t-1')).to.equal(
        'https://asset.adobe.io/themes/t-1/like',
      );
    });
  });

  // ─── updateLikeStatus ─────────────────────────────────────────────────

  describe('updateLikeStatus', () => {
    describe('validation', () => {
      [
        { label: 'null payload', input: null },
        { label: 'undefined payload', input: undefined },
        { label: 'missing id', input: { like: {} } },
        { label: 'empty id', input: { id: '', like: {} } },
      ].forEach(({ label, input }) => {
        it(`should throw ValidationError for ${label}`, async () => {
          await expectValidationError(
            () => actions.updateLikeStatus(input),
            (err) => {
              expect(err.field).to.equal('payload.id');
              expect(err.serviceName).to.equal('Kuler');
              expect(err.topic).to.equal('LIKE.UPDATE');
            },
          );
        });
      });
    });

    describe('like/unlike branching', () => {
      it('should POST to /likeDuplicate when user has NOT liked (no like.user)', async () => {
        await actions.updateLikeStatus({ id: 't-1', like: {}, source: 'KULER' });
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.include('/likeDuplicate');
        expect(opts.method).to.equal('POST');
      });

      it('should POST to /likeDuplicate when like is undefined', async () => {
        await actions.updateLikeStatus({ id: 't-1', source: 'KULER' });
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.include('/likeDuplicate');
        expect(opts.method).to.equal('POST');
      });

      it('should POST with empty object body when liking', async () => {
        await actions.updateLikeStatus({ id: 't-1', like: {} });
        const [, opts] = fetchStub.firstCall.args;
        expect(JSON.parse(opts.body)).to.deep.equal({});
      });

      it('should DELETE to /like when user HAS liked (like.user exists)', async () => {
        await actions.updateLikeStatus({
          id: 't-1',
          like: { user: { id: 'u1' } },
          source: 'KULER',
        });
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.equal('https://asset.test.io/themes/t-1/like');
        expect(url).to.not.include('likeDuplicate');
        expect(opts.method).to.equal('DELETE');
      });

      it('should POST when like.user is null', async () => {
        await actions.updateLikeStatus({ id: 't-1', like: { user: null } });
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.include('/likeDuplicate');
        expect(opts.method).to.equal('POST');
      });

      it('should POST when like.user is undefined', async () => {
        await actions.updateLikeStatus({ id: 't-1', like: { user: undefined } });
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.include('/likeDuplicate');
        expect(opts.method).to.equal('POST');
      });

      it('should not return a value (void)', async () => {
        const result = await actions.updateLikeStatus({ id: 't-1', like: {} });
        expect(result).to.be.undefined;
      });

      // ── colorWeb parity ──

      it('should POST (like) when like.user is boolean false', async () => {
        await actions.updateLikeStatus({ id: 't-1', like: { count: 0, user: false } });
        const [url, opts] = fetchStub.firstCall.args;
        expect(url).to.include('/likeDuplicate');
        expect(opts.method).to.equal('POST');
      });
    });
  });
});
