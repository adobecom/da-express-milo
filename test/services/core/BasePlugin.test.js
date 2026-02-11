import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import BasePlugin from '../../../express/code/libs/services/core/BasePlugin.js';
import BaseActionGroup from '../../../express/code/libs/services/core/BaseActionGroup.js';
import { NotFoundError, ServiceError } from '../../../express/code/libs/services/core/Errors.js';

class TestPlugin extends BasePlugin {
  static get serviceName() {
    return 'TestService';
  }
}

class TransformingPlugin extends TestPlugin {
  middlewareContextTransform(context, meta) {
    return { ...context, transformed: true, originalTopic: meta.topic };
  }
}

class TestActionGroup extends BaseActionGroup {
  getHandlers() {
    return {
      'topic.group.action': this.handle.bind(this),
    };
  }

  handle(value) {
    return `group:${value}`;
  }
}

describe('BasePlugin', () => {
  afterEach(() => sinon.restore());

  it('exposes service config, app config, and convenience getters', () => {
    const plugin = new TestPlugin({
      serviceConfig: {
        baseUrl: 'https://service.test',
        apiKey: 'api-key',
        endpoints: { search: '/search' },
      },
      appConfig: {
        features: { ENABLE_TEST: true },
        services: { test: { any: true } },
      },
    });

    expect(plugin.baseUrl).to.equal('https://service.test');
    expect(plugin.apiKey).to.equal('api-key');
    expect(plugin.endpoints).to.deep.equal({ search: '/search' });
    expect(plugin.servicesConfig).to.deep.equal({ test: { any: true } });
    expect(plugin.isActivated({})).to.be.true;
  });

  it('registers middleware and rejects non-function middleware', () => {
    const plugin = new TestPlugin();
    const mw = async (topic, args, next) => next();

    plugin.use(mw);
    expect(plugin.middlewares).to.have.length(1);
    expect(plugin.middlewares[0]).to.equal(mw);
    expect(() => plugin.use('invalid')).to.throw(TypeError, 'Middleware must be a function');
  });

  it('registerHandlers accepts plain handler maps', () => {
    const plugin = new TestPlugin();
    const handler = sinon.stub().returns('ok');

    plugin.registerHandlers({ 'topic.test': handler });

    expect(plugin.topicRegistry.get('topic.test')).to.equal(handler);
  });

  it('registerHandlers accepts action group instances', () => {
    const plugin = new TestPlugin();
    const group = new TestActionGroup(plugin);

    plugin.registerHandlers(group);

    expect(plugin.topicRegistry.has('topic.group.action')).to.be.true;
  });

  it('throws when registerHandlers receives null (current behavior)', () => {
    const plugin = new TestPlugin();
    expect(() => plugin.registerHandlers(null)).to.throw(TypeError);
  });

  it('warns and returns when registerHandlers receives non-object value', () => {
    const plugin = new TestPlugin();
    const warnStub = sinon.stub(console, 'warn');

    plugin.registerHandlers('invalid');

    expect(warnStub.calledOnce).to.be.true;
    expect(plugin.topicRegistry.size).to.equal(0);
  });

  it('warns when overwriting an existing topic handler', () => {
    const plugin = new TestPlugin();
    const warnStub = sinon.stub(console, 'warn');
    const handlerA = sinon.stub();
    const handlerB = sinon.stub();

    plugin.registerHandlers({ 'topic.test': handlerA });
    plugin.registerHandlers({ 'topic.test': handlerB });

    expect(warnStub.calledOnce).to.be.true;
    expect(plugin.topicRegistry.get('topic.test')).to.equal(handlerB);
  });

  it('dispatch throws NotFoundError when topic is missing', async () => {
    const plugin = new TestPlugin();

    try {
      await plugin.dispatch('missing.topic', 'x');
      expect.fail('Expected NotFoundError');
    } catch (error) {
      expect(error).to.be.instanceOf(NotFoundError);
      expect(error.serviceName).to.equal('TestService');
      expect(error.topic).to.equal('missing.topic');
    }
  });

  it('dispatch executes middleware chain in order and calls handler', async () => {
    const plugin = new TestPlugin();
    const sequence = [];

    plugin.registerHandlers({
      'topic.chain': (value) => {
        sequence.push(`handler:${value}`);
        return `result:${value}`;
      },
    });

    plugin.use(async (topic, args, next) => {
      sequence.push(`mw1-before:${topic}:${args[0]}`);
      const result = await next();
      sequence.push('mw1-after');
      return result;
    });

    plugin.use(async (topic, args, next) => {
      sequence.push(`mw2-before:${topic}:${args[0]}`);
      const result = await next();
      sequence.push('mw2-after');
      return result;
    });

    const result = await plugin.dispatch('topic.chain', 'abc');

    expect(result).to.equal('result:abc');
    expect(sequence).to.deep.equal([
      'mw1-before:topic.chain:abc',
      'mw2-before:topic.chain:abc',
      'handler:abc',
      'mw2-after',
      'mw1-after',
    ]);
  });

  it('dispatch throws ServiceError when middleware calls next() twice', async () => {
    const plugin = new TestPlugin();
    plugin.registerHandlers({ 'topic.twice': () => 'ok' });
    plugin.use(async (topic, args, next) => {
      await next();
      return next();
    });

    try {
      await plugin.dispatch('topic.twice');
      expect.fail('Expected ServiceError');
    } catch (error) {
      expect(error).to.be.instanceOf(ServiceError);
      expect(error.code).to.equal('MIDDLEWARE_ERROR');
      expect(error.message).to.equal('next() called multiple times');
    }
  });

  it('dispatch throws ServiceError when middleware entry is not a function', async () => {
    const plugin = new TestPlugin();
    plugin.registerHandlers({ 'topic.invalid-mw': () => 'ok' });
    plugin.middlewares.push(null);

    try {
      await plugin.dispatch('topic.invalid-mw');
      expect.fail('Expected ServiceError');
    } catch (error) {
      expect(error).to.be.instanceOf(ServiceError);
      expect(error.code).to.equal('MIDDLEWARE_ERROR');
      expect(error.message).to.include('Middleware at index 0 is not a function');
    }
  });

  it('passes transformed middleware context to middleware', async () => {
    const plugin = new TransformingPlugin();
    const contextCapture = {};

    plugin.registerHandlers({ 'topic.ctx': () => 'done' });
    const middleware = async (topic, args, next, context) => {
      contextCapture.value = context;
      return next();
    };
    middleware.buildContext = ({ serviceName }) => ({ serviceName, fromBuilder: true });
    plugin.use(middleware);

    const result = await plugin.dispatch('topic.ctx', 'arg');

    expect(result).to.equal('done');
    expect(contextCapture.value).to.deep.equal({
      serviceName: 'TestService',
      fromBuilder: true,
      transformed: true,
      originalTopic: 'topic.ctx',
    });
  });

  it('registerActionGroup validates input and wires useAction(topic)', async () => {
    const plugin = new TestPlugin();
    const group = new TestActionGroup(plugin);

    expect(() => plugin.registerActionGroup('bad', null)).to.throw('Invalid action group');

    plugin.registerActionGroup('test-group', group);
    expect(plugin.useAction('missing-group')).to.be.undefined;
    expect(plugin.useAction('test-group')).to.equal(group);

    const action = plugin.useAction('test-group', 'topic.group.action');
    const result = await action('z');
    expect(result).to.equal('group:z');
  });
});
