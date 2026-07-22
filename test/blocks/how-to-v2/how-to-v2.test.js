import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const { default: decorate } = await import('../../../express/code/blocks/how-to-v2/how-to-v2.js');

describe('How-to-v2', () => {
  let blocks;

  before(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    blocks = [...document.querySelectorAll('.how-to-v2')];
    blocks.forEach((block) => decorate(block));
  });

  describe('default (with background) — blocks[0]', () => {
    it('sets --background-image CSS custom property', () => {
      const val = blocks[0].style.getPropertyValue('--background-image');
      expect(val).to.include('url(');
      expect(val).to.include('bg.jpg');
    });

    it('creates a steps-content container with a media-container', () => {
      const stepsContent = blocks[0].querySelector('.steps-content');
      expect(stepsContent).to.exist;
      const mediaContainer = stepsContent.querySelector('.media-container');
      expect(mediaContainer).to.exist;
      expect(mediaContainer.querySelector('picture')).to.exist;
    });

    it('builds an ordered list of 3 steps', () => {
      const ol = blocks[0].querySelector('ol.steps');
      expect(ol).to.exist;
      const lis = [...ol.querySelectorAll('li.step')];
      expect(lis).to.have.length(3);
    });

    it('each step has step-indicator, step-content, h3, and detail-container', () => {
      const lis = [...blocks[0].querySelectorAll('li.step')];
      lis.forEach((li) => {
        expect(li.querySelector('.step-indicator')).to.exist;
        expect(li.querySelector('.step-content')).to.exist;
        expect(li.querySelector('h3')).to.exist;
        expect(li.querySelector('.detail-container')).to.exist;
      });
    });

    it('first step is open, remaining steps are closed', () => {
      const lis = [...blocks[0].querySelectorAll('li.step')];
      expect(lis[0].getAttribute('aria-expanded')).to.equal('true');
      expect(lis[0].querySelector('.detail-container').classList.contains('closed')).to.be.false;
      lis.slice(1).forEach((li) => {
        expect(li.getAttribute('aria-expanded')).to.equal('false');
        expect(li.querySelector('.detail-container').classList.contains('closed')).to.be.true;
      });
    });

    it('step h3 text contains the corresponding step number', () => {
      const lis = [...blocks[0].querySelectorAll('li.step')];
      lis.forEach((li, i) => {
        expect(li.querySelector('h3').textContent).to.include(String(i + 1));
      });
    });

    it('clicking a step title opens that step and closes the others', () => {
      const lis = [...blocks[0].querySelectorAll('li.step')];
      lis[1].querySelector('h3').click();
      expect(lis[1].getAttribute('aria-expanded')).to.equal('true');
      expect(lis[1].querySelector('.detail-container').classList.contains('closed')).to.be.false;
      [0, 2].forEach((idx) => {
        expect(lis[idx].getAttribute('aria-expanded')).to.equal('false');
        expect(lis[idx].querySelector('.detail-container').classList.contains('closed')).to.be.true;
      });
    });
  });

  describe('no background — blocks[1]', () => {
    it('does not set --background-image CSS custom property', () => {
      expect(blocks[1].style.getPropertyValue('--background-image')).to.equal('');
    });

    it('creates a steps-content container with a media-container', () => {
      const stepsContent = blocks[1].querySelector('.steps-content');
      expect(stepsContent).to.exist;
      const mediaContainer = stepsContent.querySelector('.media-container');
      expect(mediaContainer).to.exist;
      expect(mediaContainer.querySelector('picture')).to.exist;
    });

    it('builds an ordered list of 3 steps', () => {
      const ol = blocks[1].querySelector('ol.steps');
      expect(ol).to.exist;
      const lis = [...ol.querySelectorAll('li.step')];
      expect(lis).to.have.length(3);
    });

    it('first step is open, remaining steps are closed', () => {
      const lis = [...blocks[1].querySelectorAll('li.step')];
      expect(lis[0].getAttribute('aria-expanded')).to.equal('true');
      expect(lis[0].querySelector('.detail-container').classList.contains('closed')).to.be.false;
      lis.slice(1).forEach((li) => {
        expect(li.getAttribute('aria-expanded')).to.equal('false');
        expect(li.querySelector('.detail-container').classList.contains('closed')).to.be.true;
      });
    });

    it('step h3 text contains the corresponding step number', () => {
      const lis = [...blocks[1].querySelectorAll('li.step')];
      lis.forEach((li, i) => {
        expect(li.querySelector('h3').textContent).to.include(String(i + 1));
      });
    });
  });
});
