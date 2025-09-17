import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { mockRes } from '../blocks/test-utilities.js';
import { fetchPlanOnePlans } from '../../express/code/scripts/utils/pricing.js';

// Prevent app bootstrap during tests
window.isTestEnv = true;

const imports = await Promise.all([import('../../express/code/scripts/utils.js'), import('../../express/code/scripts/scripts.js')]);
const [{ getLibs }] = imports;

const originalFetch = window.fetch;

describe('Pricing offer format for segmentation link', () => {
  afterEach(() => {
    window.fetch = originalFetch;
    sessionStorage.removeItem('visitorCountry');
  });
  it('handles US IP', async () => {
    await import(`${getLibs()}/utils/utils.js`).then((mod) => {
      const conf = { locales: { '': { ietf: 'en-US', tk: 'hah7vzn.css' } } };
      mod.setConfig(conf);
    });
    window.fetch = sinon.stub();
    window.fetch.onFirstCall().returns(mockRes({
      payload: {
        country: 'US',
        state: 'CA',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }));
    window.fetch.onSecondCall().returns(mockRes({
      payload: {
        data: {
          find: () => {},
        },
      },
    }));
    const res = await fetchPlanOnePlans('https://commerce-stg.adobe.com/store/segmentation?cli=cc_express&pa=PA-55&ot=trial&us');
    expect(res.country).to.equal('us');
    expect(res.language).to.equal('en');
  });
});

describe('Pricing offer format for DE segmentation link', () => {
  afterEach(() => {
    window.fetch = originalFetch;
    sessionStorage.removeItem('visitorCountry');
  });
  it('handles DE IP', async () => {
    await import(`${getLibs()}/utils/utils.js`).then((mod) => {
      const conf = { locales: { '': { ietf: 'de-DE', tk: 'hah7vzn.css' } } };
      mod.setConfig(conf);
    });
    window.fetch = sinon.stub();
    window.fetch.onFirstCall().returns(mockRes({
      payload: {
        country: 'DE',
        state: 'BE',
        'Accept-Language': 'de-DE,en;q=0.9',
      },
    }));
    window.fetch.onSecondCall().returns(mockRes({
      payload: {
        data: {
          find: () => {},
        },
      },
    }));
    const res = await fetchPlanOnePlans('https://commerce-stg.adobe.com/store/segmentation?cli=cc_express&co=us&lang=en&pa=PA-55&ot=trial&svar=express_M2M');
    expect(res.country).to.equal('de');
    expect(res.language).to.equal('de');
  });
});
