import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import loggingMiddleware from '../../../express/code/libs/services/middlewares/logging.middleware.js';

describe('loggingMiddleware', () => {
  afterEach(() => sinon.restore());

  it('logs request and response and returns next result', async () => {
    const logStub = sinon.stub(console, 'log');
    const errorStub = sinon.stub(console, 'error');
    sinon.stub(performance, 'now').onFirstCall().returns(10).onSecondCall()
      .returns(20);
    const next = sinon.stub().resolves({ ok: true });

    const result = await loggingMiddleware('topic.search', ['query'], next, { serviceName: 'Kuler' });

    expect(result).to.deep.equal({ ok: true });
    expect(next.calledOnce).to.be.true;
    expect(logStub.calledTwice).to.be.true;
    expect(logStub.firstCall.args[0]).to.equal('[Kuler][topic.search] Request:');
    expect(logStub.secondCall.args[0]).to.include('[Kuler][topic.search] Response (10.00ms):');
    expect(errorStub.called).to.be.false;
  });

  it('logs request and error then rethrows', async () => {
    const logStub = sinon.stub(console, 'log');
    const errorStub = sinon.stub(console, 'error');
    sinon.stub(performance, 'now').onFirstCall().returns(100).onSecondCall()
      .returns(130);
    const next = sinon.stub().rejects(new Error('handler fail'));

    try {
      await loggingMiddleware('topic.fail', [], next, { serviceName: 'Stock' });
      expect.fail('Expected Error');
    } catch (error) {
      expect(error.message).to.equal('handler fail');
      expect(logStub.calledOnce).to.be.true;
      expect(errorStub.calledOnce).to.be.true;
      expect(errorStub.firstCall.args[0]).to.include('[Stock][topic.fail] Error (30.00ms):');
    }
  });

  it('buildContext returns service and topic metadata', () => {
    const context = loggingMiddleware.buildContext({ serviceName: 'Universal', topic: 'universal.similar' });
    expect(context).to.deep.equal({ serviceName: 'Universal', topic: 'universal.similar' });
  });
});
