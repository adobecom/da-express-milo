import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import DataActions from '../../../../plugins/stock/actions/DataActions.js';
import { StockTopics } from '../../../../plugins/stock/topics.js';

describe('DataActions', () => {
  let actions;
  let mockPlugin;
  let fetchStub;

  beforeEach(() => {
    mockPlugin = {
      getHeaders: sinon.stub().returns({
        'Content-Type': 'application/json',
        'x-api-key': 'test-key',
        'x-product': 'AdobeColor/4.0',
      }),
    };
    actions = new DataActions(mockPlugin);

    fetchStub = sinon.stub(window, 'fetch');
  });

  afterEach(() => sinon.restore());

  describe('getHandlers - action routing', () => {
    it('should return a handler for every StockTopics.DATA topic', () => {
      const handlers = actions.getHandlers();
      const expectedTopics = Object.values(StockTopics.DATA);

      expectedTopics.forEach((topic) => {
        expect(handlers).to.have.property(topic).that.is.a('function');
      });
    });

    it('should not contain any unexpected topic keys', () => {
      const handlers = actions.getHandlers();
      const handlerKeys = Object.keys(handlers);
      const expectedTopics = Object.values(StockTopics.DATA);

      expect(handlerKeys).to.have.lengthOf(expectedTopics.length);
    });
  });

  describe('checkAvailability', () => {
    it('should return true when response has files', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ files: [{ id: 1 }] }),
      });

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files?q=test');
      expect(result).to.be.true;
    });

    it('should return false when response has empty files', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      });

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files?q=test');
      expect(result).to.be.false;
    });

    it('should return false when response has no files property', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files?q=test');
      expect(result).to.be.false;
    });

    it('should return false on non-OK response', async () => {
      fetchStub.resolves({ ok: false, status: 404, statusText: 'Not Found' });

      const result = await actions.checkAvailability('https://stock.adobe.io/bad-url');
      expect(result).to.be.false;
    });

    it('should return false on network failure', async () => {
      fetchStub.rejects(new TypeError('Failed to fetch'));

      const result = await actions.checkAvailability('https://stock.adobe.io/Search/Files');
      expect(result).to.be.false;
    });

    it('should call fetch with plugin headers', async () => {
      fetchStub.resolves({
        ok: true,
        json: () => Promise.resolve({ files: [{ id: 1 }] }),
      });

      await actions.checkAvailability('https://stock.adobe.io/Search/Files');

      expect(fetchStub.calledOnce).to.be.true;
      const [url, opts] = fetchStub.firstCall.args;
      expect(url).to.equal('https://stock.adobe.io/Search/Files');
      expect(opts.method).to.equal('GET');
      expect(opts.headers['x-api-key']).to.equal('test-key');
      expect(opts.headers['x-product']).to.equal('AdobeColor/4.0');
    });
  });
});
