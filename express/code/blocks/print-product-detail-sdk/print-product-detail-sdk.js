import { createZazzleStore, extractTemplateId } from './utilities/utility-functions.js';
import { getLibs } from '../../scripts/utils.js';
import {
  html,
  render,
  useEffect,
  useRef,
  Fragment,
} from '../../scripts/vendors/htm-preact.min.js';
import { StoreProvider, useStore, DrawerProvider, useDrawer } from './components/Contexts.js';
import { ProductImages, ProductDetails, ProductHeader, CheckoutButton, Drawer } from './components/ProductComponents.js';
import { CustomizationInputs } from './components/CustomizationInputs.js';
import { trackViewTemplatePage } from '../../scripts/instrument.js';
import useSeo from './components/useSeo.js';

function LoadingSkeleton() {
  return html`
    <div class="pdpx-global-container" aria-busy="true" aria-label="Loading product information">
      <div class="pdpx-product-images-container">
        <div class="pdpx-product-hero-image-container" data-skeleton="true" style="height: 400px;"></div>
      </div>
      <div class="pdpx-product-info-wrapper">
        <div class="pdpx-product-info-heading-section-container">
          <h1 class="pdpx-product-title" data-skeleton="true" style="height: 32px; width: 60%;"></h1>
          <div class="pdpx-price-info-container" data-skeleton="true" style="height: 40px; width: 40%; margin-top: 16px;"></div>
        </div>
        <div class="pdpx-product-info-section-container">
          <div class="pdpx-customization-inputs-container" data-skeleton="true" style="height: 300px; margin-top: 24px;"></div>
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

  useSeo(templateId);

  useEffect(() => {
    if (!templateId) {
      return;
    }
    fetchProduct(templateId);
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
      window.lana?.log(`Failed to track PDP pageload: ${error}`, { tags: 'print-product-detail-sdk', severity: 'warning' });
    }
  }, [state, templateId]);

  useEffect(() => {
    if (!containerRef.current || !state) return;
    import(`${getLibs()}/martech/attributes.js`).then(({ decorateDefaultLinkAnalytics }) => {
      import(`${getLibs()}/utils/utils.js`).then(({ getConfig }) => {
        decorateDefaultLinkAnalytics(containerRef.current, getConfig());
      });
    });
  }, [state]);

  const handleDrawerRequest = (request) => {
    if (!request) {
      return;
    }
    openDrawer({ type: request.type, payload: request.payload });
  };

  if (!state) {
    return html`
      <${Fragment}>
        <${LoadingSkeleton} />
        <${Drawer} />
      </${Fragment}>
    `;
  }

  return html`
      <div ref=${containerRef} class="pdpx-global-container" data-template-id="${templateId}">
        <${ProductImages} />
        <div class="pdpx-product-info-wrapper">
          <${ProductHeader} />
          <div class="pdpx-product-info-section-container">
            <div class="pdpx-product-info-section" id="pdpx-product-info-section">
              <${CustomizationInputs} onRequestDrawer=${handleDrawerRequest} productType=${state.productType} />
              <${ProductDetails} />
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
  const store = await createZazzleStore();
  render(html`<${PDPApp} sdkStore=${store.sdk} templateId=${templateId} />`, mountPoint);
  const { loadStyle, getConfig } = await import(`${getLibs()}/utils/utils.js`);
  const { codeRoot } = getConfig();
  await Promise.all([
    new Promise((resolve) => {
      loadStyle(`${codeRoot}/scripts/widgets/simple-carousel.css`, resolve);
    }),
    new Promise((resolve) => {
      loadStyle(`${codeRoot}/scripts/widgets/picker.css`, resolve);
    }),
  ]);
}
