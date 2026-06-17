import { createZazzleStore, extractTemplateId, addPrefetchLinks } from './utilities/utility-functions.js';
import { getLibs } from '../../scripts/utils.js';
import {
  html,
  render,
  useEffect,
  useRef,
  useState,
} from '../../scripts/vendors/htm-preact.min.js';
import { StoreProvider, useStore, DrawerProvider, useDrawer } from './components/Contexts.js';
import { ProductImages, ProductDetails, ProductHeader, CheckoutButton, Drawer, AssuranceLockup } from './components/ProductComponents.js';
import { CustomizationInputs } from './components/CustomizationInputs.js';
import { trackViewTemplatePage } from '../../scripts/instrument.js';
import useSeo from './components/useSeo.js';

function LoadingSkeleton() {
  return html`
    <div class="pdpx-global-container" aria-busy="true" aria-label="Loading product information">
      <div class="pdpx-product-images-container">
        <div class="pdpx-product-hero-image-container" data-skeleton="true"></div>
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
            ${[0, 1, 2, 3].map((i) => html`
              <div key=${i} class="pdpx-skeleton-option-row">
                <div class="pdpx-skeleton-option-label" data-skeleton="true"></div>
                <div class="pdpx-skeleton-option-control" data-skeleton="true"></div>
              </div>
            `)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function PDPContent({ templateId }) {
  const store = useStore();
  const { state, actions } = store;
  const { openDrawer } = useDrawer();
  const { fetchProduct } = actions;
  const containerRef = useRef(null);
  const hasTrackedPageView = useRef(false);
  const [fetchError, setFetchError] = useState(false);

  useSeo(templateId);

  useEffect(() => {
    if (!templateId) {
      return;
    }
    fetchProduct(templateId).catch((err) => {
      window.lana?.log(`print-product-detail: fetchProduct failed: ${err.message}`, { tags: 'print-product-detail', severity: 'error' });
      setFetchError(true);
    });
  }, [templateId, fetchProduct]);

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
        templateId,
        'print',
        true,
        attributeObject,
        true,
      );
    } catch (error) {
      window.lana?.log(`Failed to track PDP pageload: ${error}`, { tags: 'print-product-detail', severity: 'warning' });
    }
  }, [state, templateId]);

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
    if (!request) {
      return;
    }
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
      <div ref=${containerRef} class="pdpx-global-container" data-template-id="${templateId}" aria-busy=${!state ? 'true' : undefined} aria-label=${!state ? 'Loading product information' : undefined}>
        <${ProductImages} />
        <div class="pdpx-product-info-wrapper">
          <${ProductHeader} />
          <div class="pdpx-product-info-section-container">
            <div class="pdpx-product-info-section" id="pdpx-product-info-section">
              <${CustomizationInputs} onRequestDrawer=${handleDrawerRequest} productType=${state?.productType} />
              <${ProductDetails} />
              <${AssuranceLockup} />
              <${Drawer} />
            </div>
            <${CheckoutButton} templateId=${templateId} />
          </div>
        </div>
      </div>
  `;
}

export function PDPApp({ sdkStore, templateId }) {
  return html`
    <${StoreProvider} sdkStore=${sdkStore}>
      <${DrawerProvider}>
        <${PDPContent} templateId=${templateId} />
      </${DrawerProvider}>
    </${StoreProvider}>
  `;
}

export default async function decorate(block) {
  const templateId = extractTemplateId(block);
  block.innerHTML = '';
  const mountPoint = document.createElement('div');
  block.append(mountPoint);

  render(html`<${LoadingSkeleton} />`, mountPoint);

  // Preload SDK module so the browser starts fetching it early
  const sdkPath = new URL('./sdk/index.min.js', import.meta.url).href;
  const preloadLink = document.createElement('link');
  preloadLink.rel = 'modulepreload';
  preloadLink.href = sdkPath;
  document.head.appendChild(preloadLink);

  // DNS prefetch + preconnect for Zazzle domains (fire-and-forget)
  addPrefetchLinks();

  // Load widget CSS in parallel (fire-and-forget, don't block decorate)
  import(`${getLibs()}/utils/utils.js`).then(({ loadStyle, getConfig }) => {
    const { codeRoot } = getConfig();
    loadStyle(`${codeRoot}/scripts/widgets/simple-carousel.css`);
    loadStyle(`${codeRoot}/scripts/widgets/picker.css`);
  });

  // Create store and mount Preact app async (skeleton already visible)
  createZazzleStore().then((store) => {
    render(html`<${PDPApp} sdkStore=${store.sdk} templateId=${templateId} />`, mountPoint);
  });
}
