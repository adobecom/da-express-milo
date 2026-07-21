import {
  createZazzleStore,
  extractTemplateId,
  extractInitialImageUrl,
  addPrefetchLinks,
  updateImageUrl,
  createHeroImageSrcset,
} from './utilities/utility-functions.js';
import { getLibs } from '../../scripts/utils.js';
import {
  html,
  render,
  useEffect,
  useRef,
  useState,
} from '../../scripts/vendors/htm-preact.min.js';

function LoadingSkeleton({ authoredImageUrl }) {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  return html`
    <div class="pdpx-global-container" aria-busy="true" aria-label="Loading product information">
      <div class="pdpx-product-images-container">
        <div class="pdpx-product-hero-image-container" data-skeleton=${!heroImageLoaded ? 'true' : undefined}>
          ${authoredImageUrl ? html`<img
            class="pdpx-product-hero-image"
            src="${updateImageUrl(authoredImageUrl, 800)}"
            srcset="${createHeroImageSrcset(authoredImageUrl)}"
            sizes="(max-width: 600px) 100vw, 50vw"
            fetchpriority="high"
            loading="eager"
            decoding="async"
            width="800"
            height="800"
            alt=""
            style=${{ opacity: heroImageLoaded ? 1 : 0, transition: 'opacity 200ms ease' }}
            onLoad=${() => setHeroImageLoaded(true)}
          />` : null}
        </div>
        <div class="pdpx-skeleton-thumbnail-row">
          ${[0, 1, 2, 3, 4].map((i) => html`<div key=${i} class="pdpx-skeleton-thumbnail" data-skeleton="true"></div>`)}
        </div>
      </div>
      <div class="pdpx-product-info-wrapper">
        <div class="pdpx-product-info-heading-section-wrapper">
          <div class="pdpx-product-info-heading-section-container">
            <div class="pdpx-title-and-ratings-container">
              <div class="pdpx-product-title-container">
                <div data-skeleton="true" style="height: 28px; width: 200px; margin-bottom: 8px;"></div>
                <div data-skeleton="true" style="height: 28px; width: 120px;"></div>
              </div>
            </div>
            <div class="pdpx-price-info-container" style="align-self: flex-start;">
              <div data-skeleton="true" style="height: 24px; width: 100px;"></div>
            </div>
          </div>
          <div class="pdpx-skeleton-pill" data-skeleton="true"></div>
        </div>
        <div class="pdpx-product-info-section-container">
          <div class="pdpx-customization-inputs-container">
            ${[0, 1, 2].map((i) => html`
              <div key=${i} class="pdpx-skeleton-option-row">
                <div class="pdpx-skeleton-option-label" data-skeleton="true"></div>
                <div class="pdpx-skeleton-option-control pdpx-skeleton-option-control--tall" data-skeleton="true"></div>
              </div>
            `)}
            ${[0, 1, 2].map((i) => html`
              <div key=${`b${i}`} class="pdpx-skeleton-option-row">
                <div class="pdpx-skeleton-option-label" data-skeleton="true"></div>
                <div class="pdpx-skeleton-option-control" data-skeleton="true"></div>
              </div>
            `)}
          </div>
          <div class="pdpx-skeleton-accordion-section">
            ${[0, 1, 2].map((i) => html`<div key=${i} class="pdpx-skeleton-accordion-row" data-skeleton="true"></div>`)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export default async function decorate(block) {
  const authoredImageUrl = extractInitialImageUrl(block);
  const templateId = extractTemplateId(block);

  // Synchronous preconnect — fires before any await
  for (const origin of ['https://rlv.zcache.com', 'https://www.zazzle.com']) {
    if (!document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
    }
  }

  // Preload authored hero image if provided — fires before any await
  if (authoredImageUrl) {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.href = updateImageUrl(authoredImageUrl, 800);
    preloadLink.setAttribute('imagesrcset', createHeroImageSrcset(authoredImageUrl));
    preloadLink.setAttribute('imagesizes', '(max-width: 600px) 100vw, 50vw');
    preloadLink.fetchPriority = 'high';
    document.head.appendChild(preloadLink);
  }

  block.innerHTML = '';
  const mountPoint = document.createElement('div');
  block.append(mountPoint);

  render(html`<${LoadingSkeleton} authoredImageUrl=${authoredImageUrl} />`, mountPoint);

  // SDK modulepreload — hints the browser to start fetching early
  const sdkPath = new URL('./sdk/index.min.js', import.meta.url).href;
  const sdkPreloadLink = document.createElement('link');
  sdkPreloadLink.rel = 'modulepreload';
  sdkPreloadLink.href = sdkPath;
  document.head.appendChild(sdkPreloadLink);

  // Locale-specific preconnect/dns-prefetch (fire-and-forget)
  addPrefetchLinks();

  // Widget CSS — fire-and-forget
  import(`${getLibs()}/utils/utils.js`).then(({ loadStyle, getConfig }) => {
    const { codeRoot } = getConfig();
    loadStyle(`${codeRoot}/scripts/widgets/simple-carousel.css`);
    loadStyle(`${codeRoot}/scripts/widgets/picker.css`);
  });

  // All component modules + SDK in parallel — skeleton already visible
  const [
    contextsModule,
    componentsModule,
    customizationModule,
    instrumentModule,
    seoModule,
    store,
  ] = await Promise.all([
    import('./components/Contexts.js'),
    import('./components/ProductComponents.js'),
    import('./components/CustomizationInputs.js'),
    import('../../scripts/instrument.js'),
    import('./components/useSeo.js'),
    createZazzleStore(),
  ]);

  const { StoreProvider, useStore, DrawerProvider, useDrawer } = contextsModule;
  const {
    ProductImages,
    ProductDetails,
    ProductHeader,
    CheckoutButton,
    Drawer,
    AssuranceLockup,
  } = componentsModule;
  const { CustomizationInputs } = customizationModule;
  const { trackViewTemplatePage } = instrumentModule;
  const useSeo = seoModule.default;

  function PDPContent({ templateId: tId, authoredImageUrl: authoredUrl }) {
    const pdpStore = useStore();
    const { state, actions } = pdpStore;
    const { openDrawer } = useDrawer();
    const { fetchProduct } = actions;
    const containerRef = useRef(null);
    const hasTrackedPageView = useRef(false);
    const [fetchError, setFetchError] = useState(false);

    useSeo(tId);

    useEffect(() => {
      if (!tId) return;
      fetchProduct(tId).catch((err) => {
        window.lana?.log(`print-product-detail: fetchProduct failed: ${err.message}`, { tags: 'print-product-detail', severity: 'error' });
        setFetchError(true);
      });
    }, [tId, fetchProduct]);

    useEffect(() => {
      if (!state || hasTrackedPageView.current) return;
      hasTrackedPageView.current = true;
      try {
        const attributeObject = Object.fromEntries(
          (state.attributes || []).map((attr) => [attr.name, attr.selectedOptionValue]),
        );
        trackViewTemplatePage(
          'pdp',
          state.productType,
          tId,
          'print',
          true,
          attributeObject,
          true,
        );
      } catch (error) {
        window.lana?.log(`Failed to track PDP pageload: ${error}`, { tags: 'print-product-detail', severity: 'warning' });
      }
    }, [state, tId]);

    useEffect(() => {
      if (!containerRef.current || !state) return;
      Promise.all([
        import(`${getLibs()}/martech/attributes.js`),
        import(`${getLibs()}/utils/utils.js`),
      ]).then(([{ decorateDefaultLinkAnalytics }, { getConfig }]) => {
        decorateDefaultLinkAnalytics(containerRef.current, getConfig());
      });
    }, [state]);

    const handleDrawerRequest = (request) => {
      if (!request) return;
      openDrawer({ type: request.type, payload: request.payload });
    };

    if (fetchError) {
      return html`
        <div class="pdpx-global-container">
          <div class="pdpx-error-container">
            <p>Something went wrong loading this product. Please try refreshing the page.</p>
          </div>
        </div>
      `;
    }

    return html`
        <div ref=${containerRef} class="pdpx-global-container" data-template-id="${tId}" aria-busy=${!state ? 'true' : undefined} aria-label=${!state ? 'Loading product information' : undefined}>
          <${ProductImages} authoredImageUrl=${authoredUrl} />
          <div class="pdpx-product-info-wrapper">
            <${ProductHeader} />
            <div class="pdpx-product-info-section-container">
              <div class="pdpx-product-info-section" id="pdpx-product-info-section">
                <${CustomizationInputs} onRequestDrawer=${handleDrawerRequest} productType=${state?.productType} />
                <${ProductDetails} />
                <${AssuranceLockup} />
                <${Drawer} />
              </div>
              <${CheckoutButton} templateId=${tId} />
            </div>
          </div>
        </div>
    `;
  }

  function PDPApp() {
    return html`
      <${StoreProvider} sdkStore=${store.sdk}>
        <${DrawerProvider}>
          <${PDPContent} templateId=${templateId} authoredImageUrl=${authoredImageUrl} />
        </${DrawerProvider}>
      </${StoreProvider}>
    `;
  }

  render(html`<${PDPApp} />`, mountPoint);
}
