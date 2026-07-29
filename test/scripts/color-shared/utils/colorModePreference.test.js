/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  VALID_COLOR_MODES,
  getPreferredColorMode,
  setPreferredColorMode,
  subscribeColorMode,
} from '../../../../express/code/scripts/color-shared/utils/colorModePreference.js';

const STORAGE_KEY = 'express-color-mode';

describe('colorModePreference', () => {
  let unsubscribes;

  beforeEach(() => {
    unsubscribes = [];
    localStorage.removeItem(STORAGE_KEY);
  });

  afterEach(() => {
    unsubscribes.forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
    unsubscribes = [];
    sinon.restore();
    localStorage.removeItem(STORAGE_KEY);
  });

  function track(unsub) {
    unsubscribes.push(unsub);
    return unsub;
  }

  describe('VALID_COLOR_MODES', () => {
    it('exports exactly HEX, RGB, HSB, Lab', () => {
      expect(VALID_COLOR_MODES).to.deep.equal(['HEX', 'RGB', 'HSB', 'Lab']);
    });
  });

  describe('getPreferredColorMode', () => {
    it('returns default fallback "HEX" when nothing is stored', () => {
      expect(getPreferredColorMode()).to.equal('HEX');
    });

    it('returns the explicit fallback when nothing is stored', () => {
      expect(getPreferredColorMode('RGB')).to.equal('RGB');
    });

    ['HEX', 'RGB', 'HSB', 'Lab'].forEach((mode) => {
      it(`returns the stored value when it is the valid mode "${mode}"`, () => {
        localStorage.setItem(STORAGE_KEY, mode);
        expect(getPreferredColorMode()).to.equal(mode);
      });
    });

    it('returns the fallback when the stored value is not in VALID_COLOR_MODES', () => {
      localStorage.setItem(STORAGE_KEY, 'xyz');
      expect(getPreferredColorMode()).to.equal('HEX');
    });

    it('returns the fallback when the stored value is an empty string', () => {
      localStorage.setItem(STORAGE_KEY, '');
      expect(getPreferredColorMode()).to.equal('HEX');
    });

    it('returns the fallback when the stored value differs only by case (e.g. "rgb")', () => {
      localStorage.setItem(STORAGE_KEY, 'rgb');
      expect(getPreferredColorMode()).to.equal('HEX');
    });

    it('returns the fallback (without throwing) when localStorage.getItem throws', () => {
      sinon.stub(Storage.prototype, 'getItem').throws(new Error('storage disabled'));
      expect(() => getPreferredColorMode('RGB')).to.not.throw();
      expect(getPreferredColorMode('RGB')).to.equal('RGB');
    });
  });

  describe('setPreferredColorMode', () => {
    it('writes a valid mode to localStorage', () => {
      setPreferredColorMode('RGB');
      expect(localStorage.getItem(STORAGE_KEY)).to.equal('RGB');
    });

    it('ignores invalid modes — no write, no listener invocation', () => {
      const spy = sinon.spy();
      track(subscribeColorMode(spy));

      setPreferredColorMode('xyz');

      expect(localStorage.getItem(STORAGE_KEY)).to.be.null;
      expect(spy.called).to.be.false;
    });

    it('still notifies subscribers when localStorage.setItem throws', () => {
      sinon.stub(Storage.prototype, 'setItem').throws(new Error('quota exceeded'));
      const spy = sinon.spy();
      track(subscribeColorMode(spy));

      expect(() => setPreferredColorMode('RGB')).to.not.throw();
      expect(spy.calledOnceWithExactly('RGB')).to.be.true;
    });

    it('isolates listener exceptions — a throwing listener does not block others', () => {
      const thrower = sinon.stub().throws(new Error('listener boom'));
      const spy = sinon.spy();
      track(subscribeColorMode(thrower));
      track(subscribeColorMode(spy));

      expect(() => setPreferredColorMode('HSB')).to.not.throw();
      expect(thrower.calledOnce).to.be.true;
      expect(spy.calledOnceWithExactly('HSB')).to.be.true;
    });
  });

  describe('subscribeColorMode', () => {
    it('invokes the listener with the new mode on each setPreferredColorMode call', () => {
      const spy = sinon.spy();
      track(subscribeColorMode(spy));

      setPreferredColorMode('RGB');
      setPreferredColorMode('Lab');

      expect(spy.callCount).to.equal(2);
      expect(spy.firstCall.args).to.deep.equal(['RGB']);
      expect(spy.secondCall.args).to.deep.equal(['Lab']);
    });

    it('notifies multiple subscribers', () => {
      const a = sinon.spy();
      const b = sinon.spy();
      track(subscribeColorMode(a));
      track(subscribeColorMode(b));

      setPreferredColorMode('HSB');

      expect(a.calledOnceWithExactly('HSB')).to.be.true;
      expect(b.calledOnceWithExactly('HSB')).to.be.true;
    });

    it('returned unsubscribe stops further notifications', () => {
      const spy = sinon.spy();
      const unsubscribe = subscribeColorMode(spy);

      setPreferredColorMode('RGB');
      unsubscribe();
      setPreferredColorMode('Lab');

      expect(spy.calledOnceWithExactly('RGB')).to.be.true;
    });

    it('returns a no-op function when the listener is not a function and never throws', () => {
      const unsubNull = subscribeColorMode(null);
      const unsubUndefined = subscribeColorMode(undefined);
      const unsubNumber = subscribeColorMode(42);

      expect(unsubNull).to.be.a('function');
      expect(unsubUndefined).to.be.a('function');
      expect(unsubNumber).to.be.a('function');

      expect(() => setPreferredColorMode('RGB')).to.not.throw();
      expect(() => {
        unsubNull();
        unsubUndefined();
        unsubNumber();
      }).to.not.throw();
    });
  });
});
