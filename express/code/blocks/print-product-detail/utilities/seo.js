export function getCanonicalUrl() {
  const existing = document.querySelector('link[rel="canonical"]');
  const href = existing?.getAttribute('href');
  return href && href.trim() ? href : window.location.href;
}

export function getAuthoredOverrides(doc = document) {
  const overrides = {};
  const titleEl = doc.querySelector('title');
  const metaDescEl = doc.querySelector('meta[name="description"]');
  const ogImgEl = doc.querySelector('meta[property="og:image"]');
  if (titleEl && titleEl.textContent && titleEl.textContent.trim()) {
    overrides.name = titleEl.textContent.trim();
  }
  if (metaDescEl && metaDescEl.content && metaDescEl.content.trim()) {
    overrides.description = metaDescEl.content.trim();
  }
  if (ogImgEl && ogImgEl.content && ogImgEl.content.trim()) {
    overrides.image = ogImgEl.content.trim();
  }
  return overrides;
}

export function upsertLdJson(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function stripHtml(input) {
  if (!input) return '';
  const div = document.createElement('div');
  div.innerHTML = input;
  const text = div.textContent || div.innerText || '';
  return text.replace(/\s+/g, ' ').trim();
}

async function getCurrencyCode() {
  const { getCurrency } = await import('../../../scripts/utils/pricing.js');
  const { getCountry } = await import('../../../scripts/utils/location-utils.js');
  const country = await getCountry();
  const currency = await getCurrency(country);
  return currency;
}

export async function buildProductJsonLd(apiData, overrides, canonicalUrl) {
  const name = overrides?.name || apiData.productTitle || '';
  const descriptionSource = overrides?.description
    || (Array.isArray(apiData.productDescriptions) && apiData.productDescriptions[0]?.description)
    || '';
  const description = stripHtml(descriptionSource);
  const image = overrides?.image || apiData.heroImage || '';
  const sku = apiData.id || apiData.templateId || '';

  const json = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: 'Adobe Express',
    },
  };

  if (sku) json.sku = String(sku);

  // Offers (if pricing available)
  if (apiData.productPrice) {
    const priceCurrency = await getCurrencyCode();
    json.offers = {
      '@type': 'Offer',
      price: Number(apiData.productPrice).toFixed(2),
      priceCurrency,
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    };
  }

  return json;
}

export function upsertTitleAndDescriptionRespectingAuthored(apiData) {
  const authored = getAuthoredOverrides(document);
  if (!authored.name && apiData.productTitle) {
    let titleEl = document.querySelector('title');
    if (!titleEl) {
      titleEl = document.createElement('title');
      document.head.appendChild(titleEl);
    }
    titleEl.textContent = apiData.productTitle;
  }
  if (!authored.description) {
    const descriptionSource = (Array.isArray(apiData.productDescriptions) && apiData.productDescriptions[0]?.description) || '';
    const description = stripHtml(descriptionSource).slice(0, 160);
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }
}

export function buildBreadcrumbsJsonLdFromDom() {
  const nav = document.querySelector('nav.feds-breadcrumbs');
  if (!nav) return null;
  const items = [];
  const lis = nav.querySelectorAll('ul > li');
  let position = 1;
  lis.forEach((li) => {
    const a = li.querySelector('a');
    const name = (a ? a.textContent : li.textContent) || '';
    const item = { '@type': 'ListItem', position, name: name.trim() };
    if (a && a.getAttribute('href')) {
      try {
        const href = new URL(a.getAttribute('href'), window.location.origin).toString();
        item.item = href;
      } catch (e) {
        // ignore malformed hrefs
      }
    }
    items.push(item);
    position += 1;
  });
  if (!items.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}
