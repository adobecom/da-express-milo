import { expect } from '@esm-bundle/chai';

window.isTestEnv = true;

const { getContentRoot } = await import('../../express/code/scripts/scripts.js');

describe('getContentRoot', () => {
  const tests = [
    ['https://main--express-color--adobecom.aem.page/', ''],
    ['https://main--express-color--adobecom.aem.live/', ''],
    ['https://color.stage.adobe.com', ''],
    ['https://color.adobe.com', ''],
    ['https://main--da-express-milo--adobecom.aem.page/', '/express'],
    ['https://main--da-express-milo--adobecom.aem.live/', '/express'],
    ['https://www.stage.adobe.com/', '/express'],
    ['https://www.adobe.com/', '/express'],
    ['http://localhost:3000', '/express'],
  ];

  tests.forEach(([url, expected]) => {
    it(`Sets content root for ${url}`, () => {
      const location = new URL(url);
      const contentRoot = getContentRoot(location);
      expect(contentRoot).to.equal(expected);
    });
  });
});
