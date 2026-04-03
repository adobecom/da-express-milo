import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import BaseProvider from '../../../express/code/libs/services/providers/BaseProvider.js';
import { ServiceError } from '../../../express/code/libs/services/core/Errors.js';

class MockPlugin {
  static get serviceName() {
    return 'MockService';
  }
}

describe('BaseProvider', () => {
  afterEach(() => {
    sinon.restore();
    delete window.lana;
  });

  it('stores and exposes plugin instance', () => {
    const plugin = new MockPlugin();
    const provider = new BaseProvider(plugin);

    expect(provider.plugin).to.equal(plugin);
    expect(provider.isAvailable).to.be.true;
  });

  it('reports unavailable when plugin is null', async () => {
    const provider = new BaseProvider(null);

    expect(provider.isAvailable).to.be.false;
    const result = await provider.safeExecute(async () => 'value');
    expect(result).to.be.null;
  });

  it('safeExecute returns action result and passes arguments', async () => {
    const provider = new BaseProvider(new MockPlugin());
    const action = sinon.stub().resolves('ok');

    const result = await provider.safeExecute(action, 'a', 'b');

    expect(result).to.equal('ok');
    expect(action.calledOnceWithExactly('a', 'b')).to.be.true;
  });

  it('safeExecute catches errors, logs, and returns null', async () => {
    const provider = new BaseProvider(new MockPlugin());
    const logSpy = sinon.spy(provider, 'logError');
    const action = sinon.stub().rejects(new Error('boom'));

    const result = await provider.safeExecute(action, 'x');

    expect(result).to.be.null;
    expect(logSpy.calledOnce).to.be.true;
    expect(logSpy.firstCall.args[0]).to.equal('functionStub');
    expect(logSpy.firstCall.args[1].message).to.equal('boom');
  });

  it('safeExecuteSync returns action result', () => {
    const provider = new BaseProvider(new MockPlugin());
    const action = sinon.stub().returns(42);

    const result = provider.safeExecuteSync(action, 'arg');

    expect(result).to.equal(42);
    expect(action.calledOnceWithExactly('arg')).to.be.true;
  });

  it('safeExecuteSync catches sync errors and returns null', () => {
    const provider = new BaseProvider(new MockPlugin());
    const logSpy = sinon.spy(provider, 'logError');
    const action = sinon.stub().throws(new Error('sync fail'));

    const result = provider.safeExecuteSync(action);

    expect(result).to.be.null;
    expect(logSpy.calledOnce).to.be.true;
    expect(logSpy.firstCall.args[0]).to.equal('functionStub');
  });

  it('logError logs ServiceError with rich metadata', () => {
    const provider = new BaseProvider(new MockPlugin());
    window.lana = { log: sinon.stub() };
    const error = new ServiceError('service failed', {
      code: 'CUSTOM_CODE',
      serviceName: 'MockService',
      topic: 'topic.test',
    });

    provider.logError('fetchData', error);

    expect(window.lana.log.calledOnce).to.be.true;
    const [message, payload] = window.lana.log.firstCall.args;
    expect(message).to.equal('MockServiceProvider fetchData error: service failed');
    expect(payload.tags).to.equal('color-explorer,mockservice-provider,fetchData');
    expect(payload.errorCode).to.equal('CUSTOM_CODE');
    expect(payload.errorType).to.equal('ServiceError');
  });

  it('logError logs UNKNOWN code for plain Error', () => {
    const provider = new BaseProvider(new MockPlugin());
    window.lana = { log: sinon.stub() };

    provider.logError('fetchData', new Error('plain fail'));

    expect(window.lana.log.calledOnce).to.be.true;
    const [, payload] = window.lana.log.firstCall.args;
    expect(payload.errorCode).to.equal('UNKNOWN');
    expect(payload.errorType).to.equal('Error');
  });

  it('logError is a no-op when lana is unavailable', () => {
    const provider = new BaseProvider(new MockPlugin());
    expect(() => provider.logError('op', new Error('no lana'))).to.not.throw();
  });
});
