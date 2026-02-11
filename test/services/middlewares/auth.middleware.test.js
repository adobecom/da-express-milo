import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import authMiddleware from '../../../express/code/libs/services/middlewares/auth.middleware.js';
import { AuthenticationError } from '../../../express/code/libs/services/core/Errors.js';

describe('authMiddleware', () => {
  afterEach(() => {
    sinon.restore();
    delete window.adobeIMS;
  });

  it('throws AuthenticationError when user is not signed in', async () => {
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(false),
    };

    try {
      await authMiddleware('topic.test', [], sinon.stub().resolves('ok'), { serviceName: 'Stock' });
      expect.fail('Expected AuthenticationError');
    } catch (error) {
      expect(error).to.be.instanceOf(AuthenticationError);
      expect(error.message).to.equal('User is not logged in, requires login');
      expect(error.serviceName).to.equal('Stock');
      expect(error.topic).to.equal('topic.test');
    }
  });

  it('calls next and returns result when user is signed in', async () => {
    window.adobeIMS = {
      isSignedInUser: sinon.stub().returns(true),
    };
    const next = sinon.stub().resolves('handler-result');

    const result = await authMiddleware('topic.test', ['arg'], next, { serviceName: 'Stock' });

    expect(next.calledOnce).to.be.true;
    expect(result).to.equal('handler-result');
  });

  it('buildContext returns service and topic metadata', () => {
    const context = authMiddleware.buildContext({ serviceName: 'Kuler', topic: 'kuler.search' });
    expect(context).to.deep.equal({ serviceName: 'Kuler', topic: 'kuler.search' });
  });
});
