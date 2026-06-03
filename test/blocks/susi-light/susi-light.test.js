/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { delay } from '../../helpers/waitfor.js';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

document.body.innerHTML = await readFile({ path: './mocks/body.html' });
const imports = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
  import('../../../express/code/blocks/susi-light/susi-light.js'),
]);
const [{
  getLibs,
}, _, {
  default: decorate, SUSIUtils, DCTX_ID_MAP, resolveTabsPanelMinHeight, resolveTabsWrapperMinHeight,
  resolveModalWrapperProfile, resolveModalWrapperHeight, applyModalWrapperReserve,
}] = imports;
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});

describe('Susi-light', async () => {
  const blocks = [...document.querySelectorAll('.susi-light')];
  const originalFetch = window.fetch;
  const originalLoadSUSI = SUSIUtils.loadSUSIScripts;
  before(async () => {
    window.fetch = sinon.stub().callsFake((url) => {
      if (/geo2/.test(url)) {
        return {
          country: 'US',
          state: 'CA',
          'Accept-Language': 'en-US,en;q=0.9',
        };
      }
      return {};
    });
    SUSIUtils.loadSUSIScripts = () => Promise.resolve(null);
    await Promise.all(blocks.map((block) => decorate(block)));
    await delay(310);
  });

  after(() => {
    window.fetch = originalFetch;
    SUSIUtils.loadSUSIScripts = originalLoadSUSI;
  });

  it('decorates susi-light with required properties', () => {
    for (const block of blocks) {
      expect(block).to.exist;
      const component = block.querySelector('susi-sentry-light');
      expect(!!component.variant).to.be.true;
      expect(!!component.config).to.be.true;
      expect(!!component.authParams).to.be.true;
    }
  });

  it('loads susi-sentry-light', () => {
    for (const block of blocks) {
      const component = block.querySelector('susi-sentry-light');
      expect(component).to.exist;
    }
  });

  describe('susi-light b2b variant', () => {
    const block = document.querySelector('.susi-light.b2b');
    it('decorates susi-light with required properties', () => {
      expect(block).to.exist;
      const component = block.querySelector('susi-sentry-light');
      expect(component.variant).to.equal('standard');
      expect(component.config.hideIcon).to.equal(true);
      expect(component.config.layout).to.equal('emailAndSocial');
    });

    it('reserves modal wrapper height from email-first profile', () => {
      expect(block.dataset.susiWrapperProfile).to.equal('b2b-email-first');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('409px');
    });

    it('sets wrapper reserve on in-page b2b block after decorate', () => {
      const wrapper = block.querySelector('.susi-wrapper');
      expect(wrapper).to.exist;
      expect(block.dataset.susiWrapperProfile).to.equal('b2b-email-first');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('409px');
    });
  });

  describe('modal wrapper profile resolver', () => {
    const el = (classes) => {
      const node = document.createElement('div');
      node.className = classes;
      return node;
    };

    it('maps b2b layout and client_id to debug-friendly profiles', () => {
      expect(resolveModalWrapperProfile(el('susi-light b2b'), 'AdobeExpressWeb')).to.equal('b2b-default');
      expect(resolveModalWrapperProfile(el('susi-light b2b'), 'AdobeExpressWeb_HED')).to.equal('b2b-hed');
      expect(resolveModalWrapperProfile(el('susi-light b2b'), 'AdobeExpressWeb_Business')).to.equal('b2b-business');
      expect(resolveModalWrapperProfile(el('susi-light b2b email-first'), 'AdobeExpressWeb_Business')).to.equal('b2b-email-first');
      expect(resolveModalWrapperProfile(el('susi-light b2b email-only'), 'AdobeExpressWeb_Business')).to.equal('b2b-email-only');
    });

    it('maps edu and student client_id to profiles', () => {
      expect(resolveModalWrapperProfile(el('susi-light edu'), 'AdobeExpressWeb')).to.equal('edu-default');
      expect(resolveModalWrapperProfile(el('susi-light edu'), 'AdobeExpressWeb_HED')).to.equal('edu-hed');
      expect(resolveModalWrapperProfile(el('susi-light edu'), 'AdobeExpressWeb_Business')).to.equal('edu-business');
      expect(resolveModalWrapperProfile(el('susi-light student'), 'AdobeExpressWeb')).to.equal('student-default');
      expect(resolveModalWrapperProfile(el('susi-light student'), 'AdobeExpressWeb_HED')).to.equal('student-hed');
      expect(resolveModalWrapperProfile(el('susi-light student email-only'), 'AdobeExpressWeb_Business')).to.equal('student-email-only');
    });

    it('returns heights from named css tokens', () => {
      expect(resolveModalWrapperHeight(el('susi-light b2b'), 'AdobeExpressWeb_HED')).to.equal(267);
      expect(resolveModalWrapperHeight(el('susi-light b2b email-only'), 'AdobeExpressWeb_Business')).to.equal(230);
      expect(resolveModalWrapperHeight(el('susi-light edu'), 'AdobeExpressWeb_Business')).to.equal(393);
      expect(resolveModalWrapperHeight(el('susi-light student'), 'AdobeExpressWeb')).to.equal(462);
      expect(resolveModalWrapperHeight(el('susi-light student'), 'AdobeExpressWeb_HED')).to.equal(422);
    });

    it('maps legacy bare buildEdu blocks to profiles', () => {
      expect(resolveModalWrapperProfile(el('susi-light'), 'AdobeExpressWeb')).to.equal('legacy-edu-express');
      expect(resolveModalWrapperProfile(el('susi-light'), 'AdobeExpressWeb_HED')).to.equal('legacy-edu-hed');
      expect(resolveModalWrapperProfile(el('susi-light'), 'AdobeExpressWeb_Business')).to.equal('edu-business');
      expect(resolveModalWrapperHeight(el('susi-light'), 'AdobeExpressWeb')).to.equal(545);
      expect(resolveModalWrapperHeight(el('susi-light'), 'AdobeExpressWeb_HED')).to.equal(478);
    });

    it('applyModalWrapperReserve sets legacy bare block height', () => {
      const block = el('susi-light');
      applyModalWrapperReserve(block, 'AdobeExpressWeb');
      expect(block.dataset.susiWrapperProfile).to.equal('legacy-edu-express');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('545px');
    });

    it('applyModalWrapperReserve sets legacy HED bare block height', () => {
      const block = el('susi-light');
      applyModalWrapperReserve(block, 'AdobeExpressWeb_HED');
      expect(block.dataset.susiWrapperProfile).to.equal('legacy-edu-hed');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('478px');
    });

    it('skips tabs blocks only', () => {
      expect(resolveModalWrapperProfile(el('susi-light tabs'), 'AdobeExpressWeb')).to.equal(null);
      expect(resolveModalWrapperHeight(el('susi-light tabs'), 'AdobeExpressWeb')).to.equal(null);
    });

    it('maps simplified to simplified profile and reserve height', () => {
      expect(resolveModalWrapperProfile(el('susi-light simplified'), 'AdobeExpressWeb')).to.equal('simplified');
      expect(resolveModalWrapperHeight(el('susi-light simplified'), 'AdobeExpressWeb')).to.equal(400);
      const block = el('susi-light simplified');
      applyModalWrapperReserve(block, 'AdobeExpressWeb');
      expect(block.dataset.susiWrapperProfile).to.equal('simplified');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('400px');
    });

    it('applyModalWrapperReserve sets block custom property', () => {
      const block = el('susi-light edu no-redirect');
      applyModalWrapperReserve(block, 'AdobeExpressWeb_HED');
      expect(block.dataset.susiWrapperProfile).to.equal('edu-hed');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('267px');
    });

    it('applyModalWrapperReserve sets edu-business height', () => {
      const block = el('susi-light edu no-redirect');
      applyModalWrapperReserve(block, 'AdobeExpressWeb_Business');
      expect(block.dataset.susiWrapperProfile).to.equal('edu-business');
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('393px');
    });
  });

  describe('susi-light tabs variant', () => {
    const block = document.querySelector('.susi-light.tabs');

    it('does not set modal wrapper profile on tabs', () => {
      expect(block.dataset.susiWrapperProfile).to.equal(undefined);
      expect(block.style.getPropertyValue('--susi-modal-wrapper-height').trim()).to.equal('');
    });

    it('sets tab panel height from tallest measured panel token + buffer', () => {
      expect(block.style.getPropertyValue('--susi-tabs-panel-height').trim()).to.equal('521px');
      expect(resolveTabsPanelMinHeight(['standard', 'edu-express'])).to.equal(521);
      expect(resolveTabsPanelMinHeight(['standard', 'standard'])).to.equal(516);
      expect(resolveTabsWrapperMinHeight(['standard', 'edu-express'])).to.equal(458);
      expect(resolveTabsPanelMinHeight(['edu-express', 'edu-express'])).to.equal(521);
      expect(resolveTabsWrapperMinHeight(['edu-express', 'edu-express'])).to.equal(367);
      expect(resolveTabsPanelMinHeight([])).to.equal(521);
      expect(resolveTabsWrapperMinHeight([])).to.equal(458);
    });

    it('allocates content into tabs', () => {
      expect(block.querySelector('.express-logo')).to.exist;
      expect(block.querySelector('.title')).to.exist;
      expect(block.querySelector('.susi-tab-panels')).to.exist;
      expect(block.querySelectorAll('.susi-tab-panels [role=tabpanel]').length).to.equal(2);
      expect(block.querySelectorAll('[role=tablist] > [role=tab]').length).to.equal(2);
      expect(block.querySelectorAll('[role=tabpanel]').length).to.equal(2);
      expect(block.querySelectorAll('[role=tabpanel].standard')).to.exist;
      expect(block.querySelectorAll('[role=tabpanel].edu-express')).to.exist;
    });

    it('decorates bubble footer', () => {
      [...block.querySelectorAll('[role=tabpanel]')].forEach((panel) => {
        expect(panel.querySelector('.footer')).to.exist;
      });
      const bubbleFooter = block.querySelector('.footer:has(h2)');
      expect(bubbleFooter).to.exist;
      expect(bubbleFooter.querySelectorAll('.susi-bubble').length).to.equal(2);
    });

    const [expectTabOneOn, expectTabTwoOn] = [
      () => {
        const [tab1, tab2] = [...block.querySelectorAll('[role=tab]')];
        const [panel1, panel2] = [...block.querySelectorAll('[role=tabpanel]')];
        expect(tab1.getAttribute('aria-selected')).to.equal('true');
        expect(tab2.getAttribute('aria-selected')).to.equal('false');
        expect(panel1.classList.contains('hide')).to.be.false;
        expect(panel2.classList.contains('hide')).to.be.true;
        expect(panel1.getAttribute('aria-hidden')).to.equal('false');
        expect(panel2.getAttribute('aria-hidden')).to.equal('true');
        expect(panel1.hasAttribute('inert')).to.be.false;
        expect(panel2.hasAttribute('inert')).to.be.true;
      },
      () => {
        const [tab1, tab2] = [...block.querySelectorAll('[role=tab]')];
        const [panel1, panel2] = [...block.querySelectorAll('[role=tabpanel]')];
        expect(tab1.getAttribute('aria-selected')).to.equal('false');
        expect(tab2.getAttribute('aria-selected')).to.equal('true');
        expect(panel1.classList.contains('hide')).to.be.true;
        expect(panel2.classList.contains('hide')).to.be.false;
        expect(panel1.getAttribute('aria-hidden')).to.equal('true');
        expect(panel2.getAttribute('aria-hidden')).to.equal('false');
        expect(panel1.hasAttribute('inert')).to.be.true;
        expect(panel2.hasAttribute('inert')).to.be.false;
      },
    ];
    it('displays first tab by default', () => {
      expectTabOneOn();
    });
    it('switches tabs', () => {
      const tab1 = block.querySelector('[role=tab]');
      const tab2 = block.querySelector('[role=tab]:nth-of-type(2)');
      tab1.click();
      expectTabOneOn();
      tab2.click();
      expectTabTwoOn();
      tab1.click();
      expectTabOneOn();
    });
  });

  describe('susi-light dynamic context variant', () => {
    const blockWithDefaultContext = document.getElementById('susi-default-context');
    const blockWithEduContext = document.querySelector('.edu.context-edu');
    it('uses default context', () => {
      expect(blockWithDefaultContext).to.exist;
      const component = blockWithDefaultContext.querySelector('susi-sentry-light');
      expect(component.authParams.dctx_id).to.equal(DCTX_ID_MAP['context-default'].stage);
    });
    it('supports edu context', () => {
      expect(blockWithEduContext).to.exist;
      const component = blockWithEduContext.querySelector('susi-sentry-light');
      expect(component.authParams.dctx_id).to.equal(DCTX_ID_MAP['context-edu'].stage);
    });
  });
});
