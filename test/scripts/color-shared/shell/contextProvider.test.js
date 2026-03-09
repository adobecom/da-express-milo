/* global globalThis */
import { expect } from '@esm-bundle/chai';
import createContextProvider from '../../../../express/code/scripts/color-shared/shell/contextProvider.js';

describe('contextProvider', () => {
  let provider;

  beforeEach(() => {
    provider = createContextProvider();
  });

  describe('Test 1: set stores values and get reads them back', () => {
    it('should store and retrieve a simple value', () => {
      provider.set('theme', 'dark');
      expect(provider.get('theme')).to.equal('dark');
    });

    it('should store and retrieve multiple values', () => {
      provider.set('theme', 'dark');
      provider.set('locale', 'en-US');
      provider.set('count', 42);

      expect(provider.get('theme')).to.equal('dark');
      expect(provider.get('locale')).to.equal('en-US');
      expect(provider.get('count')).to.equal(42);
    });

    it('should return undefined for non-existent keys', () => {
      expect(provider.get('nonexistent')).to.be.undefined;
    });

    it('should overwrite existing values', () => {
      provider.set('theme', 'dark');
      provider.set('theme', 'light');
      expect(provider.get('theme')).to.equal('light');
    });
  });

  describe('Test 2: set with identical reference does not notify', () => {
    it('should not notify listeners when setting the same primitive value', () => {
      let callCount = 0;
      provider.set('theme', 'dark');
      provider.on('theme', () => { callCount += 1; });

      provider.set('theme', 'dark');
      expect(callCount).to.equal(0);
    });

    it('should not notify listeners when setting the same object reference', () => {
      let callCount = 0;
      const obj = { color: 'blue' };

      provider.set('config', obj);
      provider.on('config', () => { callCount += 1; });

      provider.set('config', obj);
      expect(callCount).to.equal(0);
    });

    it('should notify listeners when setting a different value', () => {
      let callCount = 0;
      provider.set('theme', 'dark');
      provider.on('theme', () => { callCount += 1; });

      provider.set('theme', 'light');
      expect(callCount).to.equal(1);
    });

    it('should notify listeners when setting a different object even with same content', () => {
      let callCount = 0;
      provider.set('config', { color: 'blue' });
      provider.on('config', () => { callCount += 1; });

      provider.set('config', { color: 'blue' });
      expect(callCount).to.equal(1);
    });
  });

  describe('Test 3: on fires only for subscribed keys', () => {
    it('should fire listener only for the subscribed key', () => {
      let themeCallCount = 0;
      let localeCallCount = 0;

      provider.on('theme', () => { themeCallCount += 1; });
      provider.on('locale', () => { localeCallCount += 1; });

      provider.set('theme', 'dark');
      expect(themeCallCount).to.equal(1);
      expect(localeCallCount).to.equal(0);

      provider.set('locale', 'en-US');
      expect(themeCallCount).to.equal(1);
      expect(localeCallCount).to.equal(1);
    });

    it('should pass the new value to the listener', () => {
      let receivedValue;
      provider.on('theme', (value) => { receivedValue = value; });

      provider.set('theme', 'dark');
      expect(receivedValue).to.equal('dark');
    });

    it('should support multiple listeners on the same key', () => {
      let call1 = 0;
      let call2 = 0;

      provider.on('theme', () => { call1 += 1; });
      provider.on('theme', () => { call2 += 1; });

      provider.set('theme', 'dark');
      expect(call1).to.equal(1);
      expect(call2).to.equal(1);
    });

    it('should not fire listeners for keys that do not match', () => {
      let callCount = 0;
      provider.on('theme', () => { callCount += 1; });

      provider.set('locale', 'en-US');
      provider.set('count', 42);
      expect(callCount).to.equal(0);
    });
  });

  describe('Test 4: selector subscriptions only fire when selector output changes', () => {
    it('should fire when selector output changes', () => {
      let callCount = 0;
      let receivedValue;

      provider.on('palette.primary', (value) => {
        callCount += 1;
        receivedValue = value;
      });

      provider.set('palette', { primary: 'red', secondary: 'blue' });
      expect(callCount).to.equal(1);
      expect(receivedValue).to.equal('red');
    });

    it('should not fire when selector output remains the same', () => {
      let callCount = 0;

      provider.set('palette', { primary: 'red', secondary: 'blue' });
      provider.on('palette.primary', () => { callCount += 1; });

      provider.set('palette', { primary: 'red', secondary: 'green' });
      expect(callCount).to.equal(0);
    });

    it('should fire when selector output changes to a different value', () => {
      let callCount = 0;
      let receivedValue;

      provider.set('palette', { primary: 'red', secondary: 'blue' });
      provider.on('palette.primary', (value) => {
        callCount += 1;
        receivedValue = value;
      });

      provider.set('palette', { primary: 'yellow', secondary: 'blue' });
      expect(callCount).to.equal(1);
      expect(receivedValue).to.equal('yellow');
    });

    it('should handle nested selectors', () => {
      let callCount = 0;
      let receivedValue;

      provider.on('config.theme.mode', (value) => {
        callCount += 1;
        receivedValue = value;
      });

      provider.set('config', { theme: { mode: 'dark', size: 'large' } });
      expect(callCount).to.equal(1);
      expect(receivedValue).to.equal('dark');

      provider.set('config', { theme: { mode: 'dark', size: 'small' } });
      expect(callCount).to.equal(1);

      provider.set('config', { theme: { mode: 'light', size: 'small' } });
      expect(callCount).to.equal(2);
      expect(receivedValue).to.equal('light');
    });

    it('should return undefined for non-existent selector paths', () => {
      let receivedValue = 'initial';
      provider.on('palette.tertiary', (value) => {
        receivedValue = value;
      });

      provider.set('palette', { primary: 'red', secondary: 'blue' });
      expect(receivedValue).to.be.undefined;
    });

    it('should handle selector on non-object values gracefully', () => {
      let callCount = 0;
      provider.on('theme.mode', () => { callCount += 1; });

      provider.set('theme', 'dark');
      expect(callCount).to.equal(0);
    });
  });

  describe('Test 5: throwing listener does not break other listeners', () => {
    it('should continue notifying remaining listeners when one throws', () => {
      let secondCalled = false;
      const throwingListener = () => { throw new Error('boom'); };
      const normalListener = () => { secondCalled = true; };

      provider.on('theme', throwingListener);
      provider.on('theme', normalListener);

      provider.set('theme', 'dark');
      expect(secondCalled).to.be.true;
    });

    it('should log the error via lana when a listener throws', () => {
      const originalLana = globalThis.lana;
      const logStub = [];
      globalThis.lana = { log: (msg, opts) => logStub.push({ msg, opts }) };

      const throwingListener = () => { throw new Error('listener fail'); };
      provider.on('theme', throwingListener);

      provider.set('theme', 'dark');

      expect(logStub.length).to.equal(1);
      expect(logStub[0].msg).to.include('listener fail');
      expect(logStub[0].msg).to.include('theme');
      expect(logStub[0].opts.tags).to.include('context');

      globalThis.lana = originalLana;
    });
  });

  describe('Test 6: selector traversal blocks prototype pollution keys', () => {
    it('should return undefined for __proto__ selector', () => {
      provider.set('obj', { __proto__: { hacked: true } });
      let received = 'not-called';
      provider.on('obj.__proto__', (val) => { received = val; });

      provider.set('obj', { __proto__: { hacked: true }, other: 1 });
      expect(received).to.equal('not-called');
    });

    it('should return undefined for constructor selector', () => {
      provider.set('obj', { a: 1 });
      let received = 'not-called';
      provider.on('obj.constructor', (val) => { received = val; });

      provider.set('obj', { constructor: 'bad' });
      expect(received).to.equal('not-called');
    });

    it('should return undefined for prototype selector', () => {
      provider.set('obj', { a: 1 });
      let received = 'not-called';
      provider.on('obj.prototype', (val) => { received = val; });

      provider.set('obj', { prototype: 'bad' });
      expect(received).to.equal('not-called');
    });
  });

  describe('Test 7: set emits CustomEvent on document via event bus', () => {
    it('should dispatch a context:<key> CustomEvent on document', () => {
      let dispatched = null;
      const handler = (e) => { dispatched = e.detail; };
      document.addEventListener('context:theme', handler);

      provider.set('theme', 'dark');

      expect(dispatched).to.equal('dark');
      document.removeEventListener('context:theme', handler);
    });

    it('should not dispatch event when value is unchanged', () => {
      let callCount = 0;
      const handler = () => { callCount += 1; };
      document.addEventListener('context:theme', handler);

      provider.set('theme', 'dark');
      expect(callCount).to.equal(1);

      provider.set('theme', 'dark');
      expect(callCount).to.equal(1);

      document.removeEventListener('context:theme', handler);
    });
  });

  describe('Test 8: off removes listeners cleanly', () => {
    it('should remove a specific listener', () => {
      let callCount = 0;
      const listener = () => { callCount += 1; };

      provider.on('theme', listener);
      provider.set('theme', 'dark');
      expect(callCount).to.equal(1);

      provider.off('theme', listener);
      provider.set('theme', 'light');
      expect(callCount).to.equal(1);
    });

    it('should only remove the specified listener, not all listeners', () => {
      let call1 = 0;
      let call2 = 0;
      const listener1 = () => { call1 += 1; };
      const listener2 = () => { call2 += 1; };

      provider.on('theme', listener1);
      provider.on('theme', listener2);

      provider.off('theme', listener1);
      provider.set('theme', 'dark');

      expect(call1).to.equal(0);
      expect(call2).to.equal(1);
    });

    it('should handle removing non-existent listeners gracefully', () => {
      const listener = () => {};
      expect(() => provider.off('theme', listener)).to.not.throw();
    });

    it('should handle removing listeners from non-existent keys gracefully', () => {
      const listener = () => {};
      expect(() => provider.off('nonexistent', listener)).to.not.throw();
    });

    it('should remove selector-based listeners', () => {
      let callCount = 0;
      const listener = () => { callCount += 1; };

      provider.on('palette.primary', listener);
      provider.set('palette', { primary: 'red' });
      expect(callCount).to.equal(1);

      provider.off('palette.primary', listener);
      provider.set('palette', { primary: 'blue' });
      expect(callCount).to.equal(1);
    });
  });
});
