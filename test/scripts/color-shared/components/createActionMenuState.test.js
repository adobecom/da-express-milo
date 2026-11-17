/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import {
  createActionMenuState,
  generateRandomHexCodes,
} from '../../../../express/code/scripts/color-shared/components/createActionMenuState.js';

const LIVE_REGION_ID = 'express-spectrum-live-region';
const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

describe('createActionMenuState', () => {
  afterEach(() => sinon.restore());

  describe('generateRandomHexCodes', () => {
    it('defaults to ten lowercase #rrggbb codes', () => {
      const codes = generateRandomHexCodes();
      expect(codes).to.have.length(10);
      codes.forEach((c) => expect(c).to.match(/^#[0-9a-f]{6}$/));
    });

    it('returns the requested number of codes and pads short values', () => {
      sinon.stub(Math, 'random').returns(0);
      expect(generateRandomHexCodes(3)).to.deep.equal(['#000000', '#000000', '#000000']);
    });
  });

  describe('onGenerateRandom announcement', () => {
    it('announces the default message', async () => {
      const state = createActionMenuState('test-action-menu-default');
      state.init();
      state.addOnePaletteToHistory(['#111111', '#222222']);
      sinon.stub(Math, 'random').returns(0.5);

      state.onGenerateRandom();
      await wait(150);

      expect(document.getElementById(LIVE_REGION_ID).textContent)
        .to.include('New random palette generated');
    });

    it('announces a custom (localized) message when provided', async () => {
      const state = createActionMenuState('test-action-menu-custom', {
        randomPaletteAnnouncement: 'Nouvelle palette aléatoire',
      });
      state.init();
      state.addOnePaletteToHistory(['#111111', '#222222']);
      sinon.stub(Math, 'random').returns(0.5);

      const result = state.onGenerateRandom();
      await wait(150);

      expect(result).to.deep.equal(['#800000', '#800000']);
      expect(document.getElementById(LIVE_REGION_ID).textContent)
        .to.include('Nouvelle palette aléatoire');
    });
  });
});
