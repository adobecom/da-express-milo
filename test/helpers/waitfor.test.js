import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitFor } from './waitfor.js';

describe('waitFor', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('resolves immediately without leaving polling timers behind', async () => {
    const predicate = sinon.stub().returns(true);

    await waitFor(predicate);
    clock.tick(5000);

    expect(predicate.calledOnce).to.be.true;
  });

  it('resolves when the predicate becomes true', async () => {
    let ready = false;
    const result = waitFor(() => ready);

    ready = true;
    clock.tick(100);
    await result;
  });

  it('rejects after the requested timeout', async () => {
    const result = waitFor(() => false, 500);
    clock.tick(500);

    try {
      await result;
      expect.fail('Expected waitFor to time out');
    } catch (error) {
      expect(error.message).to.equal('Timed out waiting for predicate to be true');
    }
  });
});
