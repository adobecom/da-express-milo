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
const [{ getLibs }, _, { default: decorate, SUSIUtils, DCTX_ID_MAP }] = imports;
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
  });

  describe('susi-light tabs variant', () => {
    const block = document.querySelector('.susi-light.tabs');

    it('allocates content into tabs', () => {
      expect(block.querySelector('.express-logo')).to.exist;
      expect(block.querySelector('.title')).to.exist;
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
      },
      () => {
        const [tab1, tab2] = [...block.querySelectorAll('[role=tab]')];
        const [panel1, panel2] = [...block.querySelectorAll('[role=tabpanel]')];
        expect(tab1.getAttribute('aria-selected')).to.equal('false');
        expect(tab2.getAttribute('aria-selected')).to.equal('true');
        expect(panel1.classList.contains('hide')).to.be.true;
        expect(panel2.classList.contains('hide')).to.be.false;
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
