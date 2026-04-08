import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import errorMiddleware from '../../../express/code/libs/services/middlewares/error.middleware.js';
import { ServiceError } from '../../../express/code/libs/services/core/Errors.js';

describe('errorMiddleware', () => {
  afterEach(() => {
    sinon.restore();
    delete window.lana;
  });

  it('returns next result when no error occurs', async () => {
    const next = sinon.stub().resolves({ ok: true });

    const result = await errorMiddleware('topic.run', ['a'], next, { serviceName: 'Stock' });

    expect(result).to.deep.equal({ ok: true });
    expect(next.calledOnce).to.be.true;
  });

  it('wraps plain errors in ServiceError and logs to lana', async () => {
    window.lana = { log: sinon.stub() };
    const next = sinon.stub().rejects(new Error('raw failure'));

    try {
      await errorMiddleware('topic.fail', [], next, { serviceName: 'Kuler' });
      expect.fail('Expected ServiceError');
    } catch (error) {
      expect(error).to.be.instanceOf(ServiceError);
      expect(error.message).to.equal('raw failure');
      expect(error.serviceName).to.equal('Kuler');
      expect(error.topic).to.equal('topic.fail');
      expect(error.originalError).to.be.instanceOf(Error);
      expect(window.lana.log.calledOnce).to.be.true;
      expect(window.lana.log.firstCall.args[0]).to.include('[Kuler] topic.fail error: raw failure');
    }
  });

  it('rethrows existing ServiceError without wrapping', async () => {
    window.lana = { log: sinon.stub() };
    const existing = new ServiceError('existing', { code: 'EXISTING', serviceName: 'Stock' });
    const next = sinon.stub().rejects(existing);

    try {
      await errorMiddleware('topic.fail', [], next, { serviceName: 'Kuler' });
      expect.fail('Expected ServiceError');
    } catch (error) {
      expect(error).to.equal(existing);
      expect(window.lana.log.calledOnce).to.be.true;
      expect(window.lana.log.firstCall.args[1].errorCode).to.equal('EXISTING');
    }
  });

  it('buildContext returns service and topic metadata', () => {
    const context = errorMiddleware.buildContext({ serviceName: 'Stock', topic: 'stock.search' });
    expect(context).to.deep.equal({ serviceName: 'Stock', topic: 'stock.search' });
  });
});
