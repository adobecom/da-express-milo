import { expect } from '@esm-bundle/chai';

import {
  injectWebApplicationSchema,
  loadWebApplicationSchema,
} from '../../../express/code/scripts/utils/web-app-schema.js';

function getSchema() {
  return JSON.parse(document.getElementById('web-application-schema').textContent);
}

describe('WebApplication schema', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.title = '';
  });

  it('constructs schema fields dynamically from the page', () => {
    document.head.innerHTML = `
      <link rel="canonical" href="https://www.adobe.com/express/feature/image/crop/">
      <meta name="schema-offer-price" content="9.99">
      <meta name="schema-offer-price-currency" content="EUR">
      <meta name="schema-offer-url" content="https://authored.example.com">
      <meta name="schema-offer-availability" content="https://schema.org/PreOrder">
      <meta name="schema-application-category" content="AuthoredCategory">
      <meta name="schema-operating-system" content="AuthoredOS">
      <meta name="schema-browser-requirements" content="Authored requirements">
    `;
    document.body.innerHTML = `
      <main>
        <div>
          <div>
            <h1><em>Crop your image</em> for free.</h1>
            <p>The online Crop image tool from Adobe Express transforms your images.</p>
          </div>
        </div>
      </main>
    `;

    injectWebApplicationSchema();

    expect(getSchema()).to.deep.equal({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Crop your image for free.',
      url: 'https://www.adobe.com/express/feature/image/crop/',
      description: 'The online Crop image tool from Adobe Express transforms your images.',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '9.99',
        priceCurrency: 'EUR',
        url: 'https://www.adobe.com/express/feature/image/crop/',
        availability: 'https://schema.org/InStock',
      },
      creator: {
        '@type': 'Organization',
        name: 'Adobe',
        url: 'https://www.adobe.com',
      },
    });
  });

  it('uses default offer metadata values when not authored', () => {
    document.body.innerHTML = `
      <main>
        <div>
          <h1>Resize your image for free.</h1>
          <p>Resize images quickly in Adobe Express.</p>
        </div>
      </main>
    `;

    injectWebApplicationSchema();

    expect(getSchema().offers.price).to.equal('0');
    expect(getSchema().offers.priceCurrency).to.equal('USD');
  });

  it('only loads when web app schema metadata is enabled', () => {
    loadWebApplicationSchema();
    expect(document.getElementById('web-application-schema')).to.be.null;

    document.head.innerHTML = '<meta name="web-app-schema" content="on">';
    loadWebApplicationSchema();
    loadWebApplicationSchema();

    expect(document.querySelectorAll('#web-application-schema')).to.have.length(1);
  });
});
