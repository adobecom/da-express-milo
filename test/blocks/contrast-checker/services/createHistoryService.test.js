import { expect } from '@esm-bundle/chai';
import createHistoryService from '../../../../express/code/blocks/contrast-checker/services/createHistoryService.js';

describe('createHistoryService', () => {
  let history;

  beforeEach(() => {
    history = createHistoryService();
  });

  describe('basic push and getCurrent', () => {
    it('getCurrent returns null before any push', () => {
      expect(history.getCurrent()).to.equal(null);
    });

    it('getCurrent returns the pushed state', () => {
      const state = { fg: '#000', bg: '#FFF' };
      history.push(state);
      expect(history.getCurrent()).to.equal(state);
    });

    it('getCurrent returns the last pushed state after multiple pushes', () => {
      history.push({ fg: '#000', bg: '#FFF' });
      history.push({ fg: '#111', bg: '#EEE' });
      const last = { fg: '#222', bg: '#DDD' };
      history.push(last);
      expect(history.getCurrent()).to.equal(last);
    });
  });

  describe('undo', () => {
    it('returns null when nothing to undo', () => {
      expect(history.undo()).to.equal(null);
    });

    it('canUndo returns false initially', () => {
      expect(history.canUndo()).to.equal(false);
    });

    it('canUndo returns false after a single push', () => {
      history.push({ fg: '#000', bg: '#FFF' });
      expect(history.canUndo()).to.equal(false);
    });

    it('canUndo returns true after two pushes', () => {
      history.push({ fg: '#000', bg: '#FFF' });
      history.push({ fg: '#111', bg: '#EEE' });
      expect(history.canUndo()).to.equal(true);
    });

    it('returns the previous state', () => {
      const first = { fg: '#000', bg: '#FFF' };
      history.push(first);
      history.push({ fg: '#111', bg: '#EEE' });
      expect(history.undo()).to.equal(first);
    });

    it('getCurrent returns previous state after undo', () => {
      const first = { fg: '#000', bg: '#FFF' };
      history.push(first);
      history.push({ fg: '#111', bg: '#EEE' });
      history.undo();
      expect(history.getCurrent()).to.equal(first);
    });

    it('navigates back through history with multiple undos', () => {
      const s1 = { fg: '#000' };
      const s2 = { fg: '#111' };
      const s3 = { fg: '#222' };
      history.push(s1);
      history.push(s2);
      history.push(s3);
      expect(history.undo()).to.equal(s2);
      expect(history.undo()).to.equal(s1);
    });

    it('returns null when undoing past the beginning', () => {
      const s1 = { fg: '#000' };
      const s2 = { fg: '#111' };
      history.push(s1);
      history.push(s2);
      history.undo();
      expect(history.undo()).to.equal(null);
    });
  });

  describe('redo', () => {
    it('returns null when nothing to redo', () => {
      expect(history.redo()).to.equal(null);
    });

    it('canRedo returns false initially', () => {
      expect(history.canRedo()).to.equal(false);
    });

    it('canRedo returns true after undo', () => {
      history.push({ fg: '#000' });
      history.push({ fg: '#111' });
      history.undo();
      expect(history.canRedo()).to.equal(true);
    });

    it('restores the undone state', () => {
      const s1 = { fg: '#000' };
      const s2 = { fg: '#111' };
      history.push(s1);
      history.push(s2);
      history.undo();
      expect(history.redo()).to.equal(s2);
    });

    it('works correctly with multiple redos', () => {
      const s1 = { fg: '#000' };
      const s2 = { fg: '#111' };
      const s3 = { fg: '#222' };
      history.push(s1);
      history.push(s2);
      history.push(s3);
      history.undo();
      history.undo();
      expect(history.redo()).to.equal(s2);
      expect(history.redo()).to.equal(s3);
    });

    it('returns null when redo stack is exhausted', () => {
      history.push({ fg: '#000' });
      history.push({ fg: '#111' });
      history.undo();
      history.redo();
      expect(history.redo()).to.equal(null);
    });
  });

  describe('push clears future', () => {
    it('clears the redo stack when a new state is pushed after undo', () => {
      history.push({ fg: '#000' });
      history.push({ fg: '#111' });
      history.push({ fg: '#222' });
      history.undo();
      history.undo();
      history.push({ fg: '#999' });
      expect(history.canRedo()).to.equal(false);
      expect(history.redo()).to.equal(null);
    });

    it('canRedo returns false after push following undo', () => {
      history.push({ fg: '#000' });
      history.push({ fg: '#111' });
      history.undo();
      expect(history.canRedo()).to.equal(true);
      history.push({ fg: '#999' });
      expect(history.canRedo()).to.equal(false);
    });
  });

  describe('200-step limit', () => {
    it('caps past at 200 entries when pushing 201 states', () => {
      for (let i = 0; i <= 200; i += 1) {
        history.push({ index: i });
      }
      expect(history.getSize().past).to.equal(200);
      expect(history.getCurrent()).to.deep.equal({ index: 200 });
    });

    it('drops the oldest state when limit is exceeded', () => {
      for (let i = 0; i <= 201; i += 1) {
        history.push({ index: i });
      }
      let undone = null;
      for (let i = 0; i < 200; i += 1) {
        undone = history.undo();
      }
      expect(undone).to.deep.equal({ index: 1 });
      expect(history.undo()).to.equal(null);
    });
  });

  describe('custom limit', () => {
    it('respects a custom limit', () => {
      const small = createHistoryService(5);
      for (let i = 0; i < 7; i += 1) {
        small.push({ index: i });
      }
      expect(small.getSize().past).to.equal(5);
      expect(small.getCurrent()).to.deep.equal({ index: 6 });

      let undone = null;
      for (let i = 0; i < 5; i += 1) {
        undone = small.undo();
      }
      expect(undone).to.deep.equal({ index: 1 });
      expect(small.undo()).to.equal(null);
    });
  });

  describe('clear', () => {
    it('resets everything after pushes and undos', () => {
      history.push({ fg: '#000' });
      history.push({ fg: '#111' });
      history.push({ fg: '#222' });
      history.undo();
      history.clear();
      expect(history.getCurrent()).to.equal(null);
      expect(history.canUndo()).to.equal(false);
      expect(history.canRedo()).to.equal(false);
      expect(history.getSize()).to.deep.equal({ past: 0, future: 0 });
    });
  });

  describe('getSize', () => {
    it('returns zeros initially', () => {
      expect(history.getSize()).to.deep.equal({ past: 0, future: 0 });
    });

    it('reflects correct counts after pushes', () => {
      history.push({ a: 1 });
      expect(history.getSize()).to.deep.equal({ past: 0, future: 0 });
      history.push({ a: 2 });
      expect(history.getSize()).to.deep.equal({ past: 1, future: 0 });
      history.push({ a: 3 });
      expect(history.getSize()).to.deep.equal({ past: 2, future: 0 });
    });

    it('reflects correct counts after undos and redos', () => {
      history.push({ a: 1 });
      history.push({ a: 2 });
      history.push({ a: 3 });
      history.undo();
      expect(history.getSize()).to.deep.equal({ past: 1, future: 1 });
      history.undo();
      expect(history.getSize()).to.deep.equal({ past: 0, future: 2 });
      history.redo();
      expect(history.getSize()).to.deep.equal({ past: 1, future: 1 });
    });
  });

  describe('edge cases', () => {
    it('stores duplicate states without deduplication', () => {
      const state = { fg: '#000' };
      history.push(state);
      history.push(state);
      expect(history.getSize().past).to.equal(1);
      expect(history.undo()).to.equal(state);
      expect(history.getCurrent()).to.equal(state);
    });

    it('undo after first push returns null and keeps current', () => {
      const state = { fg: '#000' };
      history.push(state);
      expect(history.undo()).to.equal(null);
      expect(history.getCurrent()).to.equal(state);
    });

    it('handles rapid undo/redo cycles', () => {
      const s1 = { v: 1 };
      const s2 = { v: 2 };
      const s3 = { v: 3 };
      history.push(s1);
      history.push(s2);
      history.push(s3);

      expect(history.undo()).to.equal(s2);
      expect(history.redo()).to.equal(s3);
      expect(history.undo()).to.equal(s2);
      expect(history.undo()).to.equal(s1);
      expect(history.redo()).to.equal(s2);
      expect(history.redo()).to.equal(s3);
      expect(history.redo()).to.equal(null);
      expect(history.getCurrent()).to.equal(s3);
    });
  });
});
