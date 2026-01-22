import { createZazzleStore, extractTemplateId } from './utilities/utility-functions.js';
import {
  html,
  render,
  useEffect,
  Fragment,
} from '../../scripts/vendors/htm-preact.js';
import { StoreProvider, useStore, DrawerProvider, useDrawer } from './components/Contexts.js';
import { ProductImages, ProductDetails, ProductHeader, CheckoutButton, Drawer } from './components/ProductComponents.js';
import { CustomizationInputs } from './components/CustomizationInputs.js';
import useSeo from './components/useSeo.js';

function LoadingSkeleton() {
  return html`
    <div class="pdpx-global-container" someProp="someValue">
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

  useSeo(templateId);

  useEffect(() => {
    if (!templateId) {
      return;
    }
    fetchProduct(templateId);
  }, [templateId, fetchProduct]);

  const handleDrawerRequest = (request) => {
    if (!request) {
      return;
    }
    if (request.type === 'sizeChart') {
      openDrawer({ type: 'sizeChart', payload: request.payload });
    }
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
      <div class="pdpx-global-container" someProp="someValue" data-template-id="${templateId}">
        <${ProductImages} />
        <div class="pdpx-product-info-wrapper">
          <${ProductHeader} />
          <div class="pdpx-product-info-section-container">
            <div class="pdpx-product-info-section" id="pdpx-product-info-section">
              <${CustomizationInputs} onRequestDrawer=${handleDrawerRequest} />
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
  if (!templateId) {
    // eslint-disable-next-line no-console
    console.error('print-product-detail: No template ID found in block');
    return;
  }

  block.innerHTML = '';

  const mountPoint = document.createElement('div');
  block.append(mountPoint);

  const store = await createZazzleStore();
  render(html`<${PDPApp} sdkStore=${store.sdk} templateId=${templateId} />`, mountPoint);
}
