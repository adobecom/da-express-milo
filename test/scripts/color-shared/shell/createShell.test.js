import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createShell from '../../../../express/code/scripts/color-shared/shell/createShell.js';

describe('createShell', () => {
  let shell;

  beforeEach(() => {
    shell = createShell();
  });

  describe('Test 1: exposes context, preload, destroy', () => {
    it('should expose context', () => {
      expect(shell.context).to.be.an('object');
    });

    it('should expose preload as a function', () => {
      expect(shell.preload).to.be.a('function');
    });

    it('should expose destroy as a function', () => {
      expect(shell.destroy).to.be.a('function');
    });

    it('should only expose context, preload, destroy', () => {
      expect(Object.keys(shell)).to.have.members(['context', 'preload', 'destroy']);
    });
  });

  describe('Test 2: context has get, set, on, off methods', () => {
    it('should have get method', () => {
      expect(shell.context.get).to.be.a('function');
    });

    it('should have set method', () => {
      expect(shell.context.set).to.be.a('function');
    });

    it('should have on method', () => {
      expect(shell.context.on).to.be.a('function');
    });

    it('should have off method', () => {
      expect(shell.context.off).to.be.a('function');
    });
  });

  describe('Test 3: context is reactive', () => {
    it('should set and get context values', () => {
      shell.context.set('palette', { colors: ['#ff0000'] });
      expect(shell.context.get('palette')).to.deep.equal({ colors: ['#ff0000'] });
    });

    it('should notify listeners on context change', () => {
      const listener = sinon.stub();
      shell.context.on('palette', listener);

      shell.context.set('palette', { colors: ['#00ff00'] });

      expect(listener.calledOnce).to.be.true;
      expect(listener.calledWith({ colors: ['#00ff00'] })).to.be.true;
    });

    it('should not notify after off unsubscribes', () => {
      const listener = sinon.stub();
      shell.context.on('palette', listener);
      shell.context.off('palette', listener);

      shell.context.set('palette', { colors: ['#0000ff'] });

      expect(listener.called).to.be.false;
    });

    it('should not notify when value is unchanged', () => {
      const listener = sinon.stub();
      shell.context.set('mode', 'dark');
      shell.context.on('mode', listener);

      shell.context.set('mode', 'dark');

      expect(listener.called).to.be.false;
    });
  });

  describe('Test 4: preload is a function', () => {
    it('should be callable', () => {
      expect(shell.preload).to.be.a('function');
    });
  });

  describe('Test 5: destroy does not throw', () => {
    it('should not throw when called', () => {
      expect(() => shell.destroy()).to.not.throw();
    });
  });
});
