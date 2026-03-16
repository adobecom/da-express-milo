import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import createHistoryService from '../../../../express/code/blocks/contrast-checker/services/createHistoryService.js';
import createHistoryCommitController from '../../../../express/code/blocks/contrast-checker/utils/createHistoryCommitController.js';

describe('createHistoryCommitController', () => {
  let history;
  let controller;
  let clock;
  let updates;

  beforeEach(() => {
    history = createHistoryService();
    updates = [];
    clock = sinon.useFakeTimers();
    controller = createHistoryCommitController(history, {
      debounceMs: 300,
      onUpdate: () => updates.push(history.getCurrent()),
    });
  });

  afterEach(() => {
    clock.restore();
  });

  it('debounces repeated history updates into one entry', () => {
    controller.commit({ fg: '#111111', bg: '#ffffff' });
    controller.schedule({ fg: '#222222', bg: '#ffffff' });
    clock.tick(150);
    controller.schedule({ fg: '#333333', bg: '#ffffff' });
    clock.tick(299);

    expect(history.getCurrent()).to.deep.equal({ fg: '#111111', bg: '#ffffff' });

    clock.tick(1);
    expect(history.getCurrent()).to.deep.equal({ fg: '#333333', bg: '#ffffff' });
    expect(history.getSize()).to.deep.equal({ past: 1, future: 0 });
  });

  it('flushes pending state before another immediate commit', () => {
    controller.commit({ fg: '#111111', bg: '#ffffff' });
    controller.schedule({ fg: '#222222', bg: '#ffffff' });
    clock.tick(150);
    controller.flush();
    controller.commit({ fg: '#333333', bg: '#ffffff' });

    expect(history.undo()).to.deep.equal({ fg: '#222222', bg: '#ffffff' });
    expect(history.getCurrent()).to.deep.equal({ fg: '#222222', bg: '#ffffff' });
  });

  it('does not push duplicate consecutive states', () => {
    controller.commit({ fg: '#111111', bg: '#ffffff' });
    controller.schedule({ fg: '#111111', bg: '#ffffff' });
    clock.tick(300);

    expect(history.getSize()).to.deep.equal({ past: 0, future: 0 });
    expect(updates).to.have.lengthOf(1);
  });

  it('cancels pending state without pushing it', () => {
    controller.commit({ fg: '#111111', bg: '#ffffff' });
    controller.schedule({ fg: '#222222', bg: '#ffffff' });
    controller.cancel();
    clock.tick(300);

    expect(history.getCurrent()).to.deep.equal({ fg: '#111111', bg: '#ffffff' });
    expect(history.getSize()).to.deep.equal({ past: 0, future: 0 });
  });
});
