import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import BaseApiService from '../../../express/code/libs/services/core/BaseApiService.js';
import { ApiError } from '../../../express/code/libs/services/core/Errors.js';

class TestApiService extends BaseApiService {
  static get serviceName() {
    return 'TestApiService';
  }
}

describe('BaseApiService', () => {
  let service;

  beforeEach(() => {
    service = new TestApiService({
      serviceConfig: {
        baseUrl: 'https://api.example.com',
        apiKey: 'test-key',
        endpoints: { items: '/items' },
      },
    });

    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
      getAccessToken: sinon.stub().returns({ token: 'ims-token' }),
    };
  });

  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
  });

  it('buildQueryString filters nullish values and stringifies types', () => {
    const query = TestApiService.buildQueryString({
      q: 'color',
      page: 2,
      include: true,
      skip: undefined,
      extra: null,
    });

    expect(query).to.equal('q=color&page=2&include=true');
  });

  it('getHeaders includes defaults, api key, auth token, and custom headers', () => {
    const headers = service.getHeaders({
      headers: { 'x-custom': 'yes' },
    });

    expect(headers['Content-Type']).to.equal('application/json');
    expect(headers.Accept).to.equal('application/json');
    expect(headers['x-api-key']).to.equal('test-key');
    expect(headers.Authorization).to.equal('Bearer ims-token');
    expect(headers['x-custom']).to.equal('yes');
  });

  it('getHeaders omits Authorization when skipAuth is true', () => {
    const headers = service.getHeaders({ skipAuth: true });
    expect(headers.Authorization).to.be.undefined;
  });

  it('handleResponse returns parsed json for ok response', async () => {
    const response = {
      ok: true,
      status: 200,
      json: sinon.stub().resolves({ ok: true }),
    };

    const result = await service.handleResponse(response);
    expect(result).to.deep.equal({ ok: true });
  });

  it('handleResponse returns empty object for 204 response', async () => {
    const response = {
      ok: true,
      status: 204,
      json: sinon.stub(),
    };

    const result = await service.handleResponse(response);
    expect(result).to.deep.equal({});
    expect(response.json.called).to.be.false;
  });

  it('handleResponse throws ApiError on non-ok responses', async () => {
    const response = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: sinon.stub().resolves('boom'),
    };

    try {
      await service.handleResponse(response);
      expect.fail('Expected ApiError');
    } catch (error) {
      expect(error).to.be.instanceOf(ApiError);
      expect(error.statusCode).to.equal(500);
      expect(error.responseBody).to.equal('boom');
      expect(error.serviceName).to.equal('TestApiService');
    }
  });

  it('get sends request with query parameters and returns payload', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    const result = await service.get('/items', { params: { q: 'red', page: 3 } });

    expect(result).to.deep.equal({ items: [] });
    expect(fetchStub.calledOnce).to.be.true;
    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal('https://api.example.com/items?q=red&page=3');
    expect(options.method).to.equal('GET');
    expect(options.headers['x-api-key']).to.equal('test-key');
  });

  it('post sends json body and keeps Content-Type for plain objects', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ created: true }),
    });

    const payload = { name: 'test' };
    const result = await service.post('/items', payload);

    expect(result).to.deep.equal({ created: true });
    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal('https://api.example.com/items');
    expect(options.method).to.equal('POST');
    expect(options.headers['Content-Type']).to.equal('application/json');
    expect(options.body).to.equal(JSON.stringify(payload));
  });

  it('post removes Content-Type when body is FormData', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ uploaded: true }),
    });
    const formData = new FormData();
    formData.append('file', new Blob(['content']), 'file.txt');

    const result = await service.post('/upload', formData);

    expect(result).to.deep.equal({ uploaded: true });
    const [, options] = fetchStub.firstCall.args;
    expect(options.headers['Content-Type']).to.be.undefined;
    expect(options.body).to.equal(formData);
  });

  it('put sends JSON body and returns payload', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ updated: true }),
    });

    const result = await service.put('/items/1', { name: 'updated' });

    expect(result).to.deep.equal({ updated: true });
    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal('https://api.example.com/items/1');
    expect(options.method).to.equal('PUT');
    expect(options.body).to.equal(JSON.stringify({ name: 'updated' }));
  });

  it('delete sends DELETE request and returns payload', async () => {
    const fetchStub = sinon.stub(window, 'fetch').resolves({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ deleted: true }),
    });

    const result = await service.delete('/items/1');

    expect(result).to.deep.equal({ deleted: true });
    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal('https://api.example.com/items/1');
    expect(options.method).to.equal('DELETE');
  });
});
