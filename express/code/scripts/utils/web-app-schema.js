export function injectWebApplicationSchema() {
  const name = document.querySelector('main h1')?.textContent.trim() || document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const url = document.querySelector('link[rel="canonical"]')?.href || window.location.href;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
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
