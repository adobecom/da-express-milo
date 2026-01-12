export function getCanonicalUrl() {
  const existing = document.querySelector('link[rel="canonical"]');
  const href = existing?.getAttribute('href');
  return href && href.trim() ? href : window.location.href;
}

export function getProductCategory(productType) {
  const productCategoryMap = {
    zazzle_shirt: 'T-shirt',
    zazzle_businesscard: 'Business card',
    mojo_throwpillow: 'Pillow',
    zazzle_mug: 'Mug',
    zazzle_bag: 'Bag',
    zazzle_flyer: 'Flyer',
    zazzle_print: 'Print',
    zazzle_sticker: 'Sticker',
    zazzle_invitation3: 'Invitation',
    zazzle_foldedthankyoucard: 'Thank you card',
    zazzle_poster: 'Poster',
    zazzle_card: 'Card',
    zazzle_banner: 'Banner',
    zazzle_sign: 'Sign',
    zazzle_label: 'Label',
    zazzle_envelope: 'Envelope',
    zazzle_envelopeset: 'Envelope set',
    zazzle_booklet: 'Booklet',
    default: 'Printed product',
  };
  return productCategoryMap[productType] || productCategoryMap.default;
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
  const category = getProductCategory(apiData.productType);
  // if image is default, use the hero image
  const imageURL = overrides?.image === 'https://www.adobe.com/default-meta-image.png?width=1200&format=pjpg&optimize=medium' ? apiData.heroImage : overrides?.image;
  const sku = apiData.id || apiData.templateId || '';
  const url = canonicalUrl;
  const json = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name,
    description,
    category,
    image: {
      '@type': 'ImageObject',
      url: imageURL,
      height: '644',
      width: '644',
      caption: name,
    },
    url,
    brand: {
      '@type': 'Brand',
      name: 'Adobe Express',
      logo: 'https://www.adobe.com/content/dam/cc/icons/AdobeExpressAppIcon.svg',
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
      seller: {
        '@type': 'Organization',
        name: 'Adobe Express',
        url: 'https://www.adobe.com/express/',
      },
      itemCondition: 'https://schema.org/NewCondition',
    };
  }

  // Aggregate rating (if reviews available)
  const ratingValue = Number(apiData.averageRating);
  const reviewCount = Number(apiData.totalReviews);
  if (!Number.isNaN(ratingValue) && !Number.isNaN(reviewCount) && reviewCount > 0) {
    json.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      reviewCount,
      bestRating: 5,
      worstRating: 1,
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
