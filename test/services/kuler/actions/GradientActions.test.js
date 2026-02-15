import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { GradientActions } from '../../../../express/code/libs/services/plugins/kuler/actions/KulerActions.js';
import { KulerTopics } from '../../../../express/code/libs/services/plugins/kuler/topics.js';
import { expectValidationError, createMockPlugin, stubFetch } from './helpers.js';

describe('GradientActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = createMockPlugin();
    actions = new GradientActions(mockPlugin);
    fetchStub = stubFetch({ id: 'grad-1' });
  });

  afterEach(() => sinon.restore());

  // ─── getHandlers ──────────────────────────────────────────────────────

  describe('getHandlers', () => {
    it('should map every KulerTopics.GRADIENT value to a function', () => {
      const handlers = actions.getHandlers();
      Object.values(KulerTopics.GRADIENT).forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should have exactly 2 handlers', () => {
      expect(Object.keys(actions.getHandlers())).to.have.lengthOf(2);
    });
  });

  // ─── URL Builders ─────────────────────────────────────────────────────

  describe('buildGradientSaveUrl', () => {
    it('should build URL from configured endpoints', () => {
      expect(actions.buildGradientSaveUrl()).to.equal('https://gradient.test.io/api/v2/gradient');
    });

    it('should fall back to all defaults when endpoints are empty', () => {
      mockPlugin.endpoints = {};
      expect(actions.buildGradientSaveUrl()).to.equal('https://gradient.adobe.io/api/v2/gradient');
    });

    it('should fall back piecemeal (only gradientBaseUrl set)', () => {
      mockPlugin.endpoints = { gradientBaseUrl: 'https://custom.io' };
      expect(actions.buildGradientSaveUrl()).to.equal('https://custom.io/api/v2/gradient');
    });
  });

  describe('buildGradientDeleteUrl', () => {
    it('should append gradient ID to save URL', () => {
      expect(actions.buildGradientDeleteUrl('g-1')).to.equal(
        'https://gradient.test.io/api/v2/gradient/g-1',
      );
    });

    it('should fall back to defaults when endpoints are empty', () => {
      mockPlugin.endpoints = {};
      expect(actions.buildGradientDeleteUrl('g-1')).to.equal(
        'https://gradient.adobe.io/api/v2/gradient/g-1',
      );
    });
  });

  // ─── saveGradient ─────────────────────────────────────────────────────

  describe('saveGradient', () => {
    describe('validation', () => {
      [
        { label: 'null', input: null },
        { label: 'undefined', input: undefined },
      ].forEach(({ label, input }) => {
        it(`should throw ValidationError for ${label} gradientData`, async () => {
          await expectValidationError(
            () => actions.saveGradient(input),
            (err) => {
              expect(err.field).to.equal('gradientData');
              expect(err.serviceName).to.equal('Kuler');
              expect(err.topic).to.equal('GRADIENT.SAVE');
            },
          );
        });
      });

      it('should NOT throw for empty object (falsy check only)', async () => {
        // {} is truthy, so it passes validation and POSTs
        await actions.saveGradient({});
        expect(fetchStub.calledOnce).to.be.true;
      });
    });

    it('should POST gradient data to correct URL', async () => {
      const data = { name: 'Blue Fade', stops: [{ color: '#0000FF' }] };
      await actions.saveGradient(data);
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://gradient.test.io/api/v2/gradient');
      expect(opts.method).to.equal('POST');
      expect(JSON.parse(opts.body)).to.deep.equal(data);
    });

    // ── colorWeb parity ──

    it('should POST full gradient structure with multiple stops intact', async () => {
      const gradientData = {
        name: 'gradient_colorful',
        stops: [
          { color: [{ mode: 'RGB', value: { r: 71, g: 56, b: 215 } }], position: 0 },
          { color: [{ mode: 'RGB', value: { r: 131, g: 114, b: 157 } }], position: 0.5 },
          { color: [{ mode: 'RGB', value: { r: 86, g: 18, b: 183 } }], position: 1 },
        ],
        interpolation: 'linear',
        angle: 0,
        aspectRatio: 1,
        source: 'KULER',
        type: 'linear',
      };
      await actions.saveGradient(gradientData);

      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.include('/gradient');
      const body = JSON.parse(opts.body);
      expect(body.stops).to.have.lengthOf(3);
      expect(body.interpolation).to.equal('linear');
      expect(body.type).to.equal('linear');
      expect(body.source).to.equal('KULER');
    });
  });

  // ─── deleteGradient ───────────────────────────────────────────────────

  describe('deleteGradient', () => {
    describe('validation', () => {
      [
        { label: 'null payload', input: null },
        { label: 'undefined payload', input: undefined },
        { label: 'missing id', input: { name: 'x' } },
        { label: 'empty id', input: { id: '', name: 'x' } },
      ].forEach(({ label, input }) => {
        it(`should throw ValidationError for ${label}`, async () => {
          await expectValidationError(
            () => actions.deleteGradient(input),
            (err) => {
              expect(err.field).to.equal('payload.id');
              expect(err.topic).to.equal('GRADIENT.DELETE');
            },
          );
        });
      });
    });

    it('should DELETE to correct URL', async () => {
      await actions.deleteGradient({ id: 'g-del', name: 'Old' });
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://gradient.test.io/api/v2/gradient/g-del');
      expect(opts.method).to.equal('DELETE');
    });

    it('should return response wrapped with gradientName', async () => {
      const result = await actions.deleteGradient({ id: 'g', name: 'Sunset Grad' });
      expect(result.gradientName).to.equal('Sunset Grad');
      expect(result.response).to.deep.equal({ id: 'grad-1' });
    });

    it('should handle missing name gracefully (undefined gradientName)', async () => {
      const result = await actions.deleteGradient({ id: 'g' });
      expect(result.gradientName).to.be.undefined;
    });
  });
});
