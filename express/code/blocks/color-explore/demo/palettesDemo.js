import { createStripContainerRenderer } from '../../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import { createSwatchesRenderer } from '../../../scripts/color-shared/renderers/createSwatchesRenderer.js';

function createSectionTitle(text, level = 3) {
  const el = document.createElement(`h${level}`);
  el.textContent = text;
  return el;
}

function createVariantViewport(orientation) {
  const viewport = document.createElement('div');
  viewport.className = 'strip-variant__content swatches-demo-viewport color-explorer-strip-container strip-container';

  // Demo-only explicit viewport for height adaptability checks.
  if (orientation === 'vertical' || orientation === 'vertical-10' || orientation === 'two-rows') {
    viewport.style.height = '400px';
    viewport.style.minHeight = '400px';
    viewport.style.overflow = 'auto';
  }

  return viewport;
}

function normalizeDemoData(data) {
  const first = (Array.isArray(data) ? data : []).slice(0, 1);
  return first;
}

function toTenColors(colors = []) {
  const list = Array.isArray(colors) ? colors.filter(Boolean) : [];
  if (!list.length) return list;
  const out = [];
  while (out.length < 10) out.push(list[out.length % list.length]);
  return out.slice(0, 10);
}

function normalizeTwoRowsData(data) {
  return normalizeDemoData(data).map((entry) => ({
    ...entry,
    colors: toTenColors(entry?.colors),
  }));
}

function normalizeVerticalTenData(data) {
  return normalizeDemoData(data).map((entry) => ({
    ...entry,
    colors: toTenColors(entry?.colors),
  }));
}

export async function createPalettesReviewDemo(container, data, config) {
  const reviewSection = document.createElement('section');
  reviewSection.className = 'color-explore-review-section';
  reviewSection.appendChild(createSectionTitle('Swatches variants (limited scope demo)', 2));

  const summary = document.createElement('p');
  summary.textContent = 'Demo scope: stacked, vertical, vertical-10, two-rows, color-blindness.';
  reviewSection.appendChild(summary);

  const swatchOrientations = ['stacked', 'vertical', 'vertical-10', 'two-rows', 'color-blindness'];
  const renderers = [];

  await Promise.all(swatchOrientations.map(async (orientation) => {
    const variantWrap = document.createElement('div');
    variantWrap.className = `strip-variant strip-variant--${orientation}`;
    variantWrap.appendChild(createSectionTitle(orientation, 4));

    const viewport = createVariantViewport(orientation);
    variantWrap.appendChild(viewport);
    reviewSection.appendChild(variantWrap);

    const isColorBlindness = orientation === 'color-blindness';
    const renderer = isColorBlindness
      ? createStripContainerRenderer({
        container: viewport,
        data: normalizeDemoData(data),
        config: {
          ...config,
          contentMode: 'swatches',
          colorBlindness: true,
          stripContainerOrientations: ['four-rows'],
        },
      })
      : createSwatchesRenderer({
        container: viewport,
        data:
          orientation === 'two-rows'
            ? normalizeTwoRowsData(data)
            : orientation === 'vertical-10'
              ? normalizeVerticalTenData(data)
              : normalizeDemoData(data),
        config: {
          ...config,
          contentMode: 'swatches',
          swatchOrientation: orientation === 'vertical-10' ? 'vertical' : orientation,
          ...(orientation === 'vertical-10' ? { swatchVerticalMaxPerRow: 10 } : {}),
          ...(orientation === 'stacked' ? { swatchFeatures: { drag: true, trash: true } } : {}),
        },
      });
    renderers.push({ renderer, orientation });
    await renderer.render(viewport);
  }));

  container.appendChild(reviewSection);

  return {
    on(event, cb) {
      renderers.forEach(({ renderer }) => renderer.on?.(event, cb));
      return this;
    },
    update(newData) {
      const nextDemoData = normalizeDemoData(newData);
      const nextTwoRowsData = normalizeTwoRowsData(newData);
      renderers.forEach(({ renderer, orientation }) => {
        renderer.update(
          orientation === 'two-rows'
            ? nextTwoRowsData
            : orientation === 'vertical-10'
              ? normalizeVerticalTenData(newData)
              : nextDemoData,
        );
      });
    },
    destroy() {
      renderers.forEach(({ renderer }) => renderer.destroy?.());
      reviewSection.remove();
    },
  };
}

export default createPalettesReviewDemo;
