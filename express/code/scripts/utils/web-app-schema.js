function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content;
}

export function injectWebApplicationSchema() {
  const name = document.querySelector('main h1')?.textContent.trim() || document.title;
  const description = getMeta('description') || '';
  const url = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

  const offerPrice = getMeta('schema-offer-price') ?? '0';
  const offerPriceCurrency = getMeta('schema-offer-price-currency') || 'USD';
  const offerUrl = getMeta('schema-offer-url');
  const offerAvailability = getMeta('schema-offer-availability');

  const offer = { '@type': 'Offer', price: offerPrice, priceCurrency: offerPriceCurrency };
  if (offerUrl) offer.url = offerUrl;
  if (offerAvailability) offer.availability = offerAvailability;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description,
    applicationCategory: getMeta('schema-application-category') || 'MultimediaApplication',
    operatingSystem: getMeta('schema-operating-system') || 'Any',
    browserRequirements: getMeta('schema-browser-requirements') || 'Requires JavaScript. Requires HTML5.',
    offers: offer,
    creator: {
      '@type': 'Organization',
      name: 'Adobe',
      url: 'https://www.adobe.com',
    },
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'web-application-schema';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function loadWebApplicationSchema() {
  if (getMeta('web-app-schema') !== 'on') return;
  if (document.getElementById('web-application-schema')) return;
  injectWebApplicationSchema();
}
