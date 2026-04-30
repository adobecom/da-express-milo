function getMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content;
}

function getPageDescription() {
  const h1 = document.querySelector('main h1');
  const intro = h1?.closest('div')?.querySelector('p') || document.querySelector('main p');
  return intro?.textContent.trim() || '';
}

export function injectWebApplicationSchema() {
  const name = document.querySelector('main h1')?.textContent.trim() || document.title;
  const url = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

  const offerPrice = getMeta('schema-offer-price') ?? '0';
  const offerPriceCurrency = getMeta('schema-offer-price-currency') || 'USD';

  const offer = {
    '@type': 'Offer',
    price: offerPrice,
    priceCurrency: offerPriceCurrency,
    url,
    availability: 'https://schema.org/InStock',
  };

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description: getPageDescription(),
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
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
