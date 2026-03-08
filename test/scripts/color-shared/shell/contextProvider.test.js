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
      provider.on('theme', () => { callCount++; });
      
      provider.set('theme', 'dark');
      expect(callCount).to.equal(0);
    });

    it('should not notify listeners when setting the same object reference', () => {
      let callCount = 0;
      const obj = { color: 'blue' };
      
      provider.set('config', obj);
      provider.on('config', () => { callCount++; });
      
      provider.set('config', obj);
      expect(callCount).to.equal(0);
    });

    it('should notify listeners when setting a different value', () => {
      let callCount = 0;
      provider.set('theme', 'dark');
      provider.on('theme', () => { callCount++; });
      
      provider.set('theme', 'light');
      expect(callCount).to.equal(1);
    });

    it('should notify listeners when setting a different object even with same content', () => {
      let callCount = 0;
      provider.set('config', { color: 'blue' });
      provider.on('config', () => { callCount++; });
      
      provider.set('config', { color: 'blue' });
      expect(callCount).to.equal(1);
    });
  });

  describe('Test 3: on fires only for subscribed keys', () => {
    it('should fire listener only for the subscribed key', () => {
      let themeCallCount = 0;
      let localeCallCount = 0;
      
      provider.on('theme', () => { themeCallCount++; });
      provider.on('locale', () => { localeCallCount++; });
      
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
      
      provider.on('theme', () => { call1++; });
      provider.on('theme', () => { call2++; });
      
      provider.set('theme', 'dark');
      expect(call1).to.equal(1);
      expect(call2).to.equal(1);
    });

    it('should not fire listeners for keys that do not match', () => {
      let callCount = 0;
      provider.on('theme', () => { callCount++; });
      
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
        callCount++;
        receivedValue = value;
      });
      
      provider.set('palette', { primary: 'red', secondary: 'blue' });
      expect(callCount).to.equal(1);
      expect(receivedValue).to.equal('red');
    });

    it('should not fire when selector output remains the same', () => {
      let callCount = 0;
      
      provider.set('palette', { primary: 'red', secondary: 'blue' });
      provider.on('palette.primary', () => { callCount++; });
      
      provider.set('palette', { primary: 'red', secondary: 'green' });
      expect(callCount).to.equal(0);
    });

    it('should fire when selector output changes to a different value', () => {
      let callCount = 0;
      let receivedValue;
      
      provider.set('palette', { primary: 'red', secondary: 'blue' });
      provider.on('palette.primary', (value) => {
        callCount++;
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
        callCount++;
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
      provider.on('theme.mode', () => { callCount++; });
      
      provider.set('theme', 'dark');
      expect(callCount).to.equal(0);
    });
  });

  describe('Test 5: off removes listeners cleanly', () => {
    it('should remove a specific listener', () => {
      let callCount = 0;
      const listener = () => { callCount++; };
      
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
      const listener1 = () => { call1++; };
      const listener2 = () => { call2++; };
      
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
      const listener = () => { callCount++; };
      
      provider.on('palette.primary', listener);
      provider.set('palette', { primary: 'red' });
      expect(callCount).to.equal(1);
      
      provider.off('palette.primary', listener);
      provider.set('palette', { primary: 'blue' });
      expect(callCount).to.equal(1);
    });
  });
});
