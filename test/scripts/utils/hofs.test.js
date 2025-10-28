import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { debounce, throttle, memoize } from '../../../express/code/scripts/utils/hofs.js';

setLibs('/libs');

describe('Higher Order Functions (HOFs)', () => {
  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount += 1;
      }, 50);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not have been called yet
      expect(callCount).to.equal(0);

      // Wait for debounce delay
      setTimeout(() => {
        expect(callCount).to.equal(1);
        done();
      }, 100);
    });

    it('should debounce with leading option', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount += 1;
      }, 50, { leading: true });

      // First call should execute immediately
      debouncedFn();
      expect(callCount).to.equal(1);

      // Subsequent calls should be debounced
      debouncedFn();
      debouncedFn();
      expect(callCount).to.equal(1);

      // Wait for debounce delay
      setTimeout(() => {
        expect(callCount).to.equal(2);
        done();
      }, 100);
    });

    it('should pass arguments correctly', (done) => {
      let receivedArgs = [];
      const debouncedFn = debounce((...args) => {
        receivedArgs = args;
      }, 50);

      debouncedFn('arg1', 'arg2', 'arg3');

      setTimeout(() => {
        expect(receivedArgs).to.deep.equal(['arg1', 'arg2', 'arg3']);
        done();
      }, 100);
    });

    it('should maintain this context', (done) => {
      const obj = {
        value: 'test',
        debouncedMethod: debounce(function debouncedMethod() {
          return this.value;
        }, 50),
      };

      obj.debouncedMethod();

      setTimeout(() => {
        expect(obj.value).to.equal('test');
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount += 1;
      }, 50);

      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();

      // Should have been called once immediately
      expect(callCount).to.equal(1);

      // Wait for throttle delay
      setTimeout(() => {
        expect(callCount).to.equal(1);
        done();
      }, 100);
    });

    it('should throttle with trailing option', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount += 1;
      }, 50, { trailing: true });

      // First call should execute immediately
      throttledFn();
      expect(callCount).to.equal(1);

      // Subsequent calls should be throttled
      throttledFn();
      throttledFn();
      expect(callCount).to.equal(1);

      // Wait for throttle delay - should execute trailing call
      setTimeout(() => {
        expect(callCount).to.equal(2);
        done();
      }, 100);
    });

    it('should pass arguments correctly', (done) => {
      let receivedArgs = [];
      const throttledFn = throttle((...args) => {
        receivedArgs = args;
      }, 50);

      throttledFn('arg1', 'arg2', 'arg3');

      setTimeout(() => {
        expect(receivedArgs).to.deep.equal(['arg1', 'arg2', 'arg3']);
        done();
      }, 100);
    });

    it('should maintain this context', (done) => {
      const obj = {
        value: 'test',
        throttledMethod: throttle(function throttledMethod() {
          return this.value;
        }, 50),
      };

      obj.throttledMethod();

      setTimeout(() => {
        expect(obj.value).to.equal('test');
        done();
      }, 100);
    });
  });

  describe('memoize', () => {
    it('should memoize function results', () => {
      let callCount = 0;
      const memoizedFn = memoize((x) => {
        callCount += 1;
        return x * 2;
      }, { ttl: 1000 });

      // First call
      expect(memoizedFn(5)).to.equal(10);
      expect(callCount).to.equal(1);

      // Second call with same args should use cache
      expect(memoizedFn(5)).to.equal(10);
      expect(callCount).to.equal(1);

      // Different args should call function again
      expect(memoizedFn(3)).to.equal(6);
      expect(callCount).to.equal(2);
    });

    it('should handle multiple arguments', () => {
      let callCount = 0;
      const memoizedFn = memoize((a, b, c) => {
        callCount += 1;
        return a + b + c;
      }, { ttl: 1000 });

      expect(memoizedFn(1, 2, 3)).to.equal(6);
      expect(callCount).to.equal(1);

      expect(memoizedFn(1, 2, 3)).to.equal(6);
      expect(callCount).to.equal(1);

      expect(memoizedFn(1, 2, 4)).to.equal(7);
      expect(callCount).to.equal(2);
    });

    it('should use custom key function', () => {
      let callCount = 0;
      const memoizedFn = memoize((obj) => {
        callCount += 1;
        return obj.value;
      }, { key: (obj) => obj.id, ttl: 1000 });

      const obj1 = { id: 1, value: 'test1' };
      const obj2 = { id: 1, value: 'test2' }; // Same id, different value

      expect(memoizedFn(obj1)).to.equal('test1');
      expect(callCount).to.equal(1);

      // Should use cache even though value is different
      expect(memoizedFn(obj2)).to.equal('test1');
      expect(callCount).to.equal(1);
    });

    it('should handle TTL expiration', (done) => {
      let callCount = 0;
      const memoizedFn = memoize((x) => {
        callCount += 1;
        return x * 2;
      }, { ttl: 100 });

      expect(memoizedFn(5)).to.equal(10);
      expect(callCount).to.equal(1);

      // Should use cache before TTL expires
      expect(memoizedFn(5)).to.equal(10);
      expect(callCount).to.equal(1);

      // After TTL expires, should call function again
      setTimeout(() => {
        expect(memoizedFn(5)).to.equal(10);
        expect(callCount).to.equal(2);
        done();
      }, 150);
    });

    it('should handle async functions', async () => {
      let callCount = 0;
      const memoizedFn = memoize(async (x) => {
        callCount += 1;
        return new Promise((resolve) => {
          setTimeout(() => resolve(x * 2), 10);
        });
      }, { ttl: 1000 });

      const result1 = await memoizedFn(5);
      expect(result1).to.equal(10);
      expect(callCount).to.equal(1);

      const result2 = await memoizedFn(5);
      expect(result2).to.equal(10);
      expect(callCount).to.equal(1);
    });

    it('should handle async function errors', async () => {
      let callCount = 0;
      const memoizedFn = memoize(async (x) => {
        callCount += 1;
        if (x === 5) {
          throw new Error('Test error');
        }
        return x * 2;
      }, { ttl: 1000 });

      try {
        await memoizedFn(5);
      } catch (error) {
        expect(error.message).to.equal('Test error');
      }
      expect(callCount).to.equal(1);

      // Should call function again after error
      try {
        await memoizedFn(5);
      } catch (error) {
        expect(error.message).to.equal('Test error');
      }
      expect(callCount).to.equal(2);
    });

    it('should throw error for invalid function', () => {
      expect(() => memoize('not a function', { ttl: 1000 })).to.throw('cb must be a function');
      expect(() => memoize(123, { ttl: 1000 })).to.throw('cb must be a function');
      expect(() => memoize({}, { ttl: 1000 })).to.throw('cb must be a function');
    });

    it('should handle falsy function values', () => {
      // Falsy values should not throw and should return a function
      expect(typeof memoize(null, { ttl: 1000 })).to.equal('function');
      expect(typeof memoize(undefined, { ttl: 1000 })).to.equal('function');
      expect(typeof memoize('', { ttl: 1000 })).to.equal('function');
    });

    it('should throw error for invalid TTL', () => {
      expect(() => memoize(() => {}, { ttl: 0 })).to.throw('ttl must be greater than 0');
      expect(() => memoize(() => {}, { ttl: -1 })).to.throw('ttl must be greater than 0');
      expect(() => memoize(() => {}, { ttl: 1.5 })).to.throw('ttl must be greater than 0');
    });

    it('should handle complex objects as arguments', () => {
      let callCount = 0;
      const memoizedFn = memoize((obj) => {
        callCount += 1;
        return obj.a + obj.b;
      }, { ttl: 1000 });

      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 }; // Same structure, different reference

      expect(memoizedFn(obj1)).to.equal(3);
      expect(callCount).to.equal(1);

      // Should use cache for same object structure (default key function joins args)
      expect(memoizedFn(obj2)).to.equal(3);
      expect(callCount).to.equal(1);
    });

    it('should handle functions with no arguments', () => {
      let callCount = 0;
      const memoizedFn = memoize(() => {
        callCount += 1;
        return 'constant';
      }, { ttl: 1000 });

      expect(memoizedFn()).to.equal('constant');
      expect(callCount).to.equal(1);

      expect(memoizedFn()).to.equal('constant');
      expect(callCount).to.equal(1);
    });
  });
});
