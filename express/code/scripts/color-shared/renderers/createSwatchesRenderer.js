import { createBaseRenderer } from './createBaseRenderer.js';
import { createColorEditAdapter, createSwatchRailAdapter } from '../adapters/litComponentAdapters.js';

const DEFAULT_SWATCH_ORIENTATION = 'stacked';
const MOBILE_BREAKPOINT_QUERY = '(max-width: 599px)';

function normalizeHex(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function normalizePalette(entry, index) {
  const swatches = Array.isArray(entry?.swatches) ? entry.swatches : null;
  const colorsFromSwatches = swatches
    ? swatches
      .map((swatch) => {
        if (typeof swatch === 'string') return normalizeHex(swatch);
        return normalizeHex(swatch?.hex || swatch?.value || '');
      })
      .filter(Boolean)
    : [];
  const colorsFromPalette = Array.isArray(entry?.colors)
    ? entry.colors.map((color) => normalizeHex(color)).filter(Boolean)
    : [];
  const colors = colorsFromSwatches.length ? colorsFromSwatches : colorsFromPalette;
  return {
    ...entry,
    id: entry?.id || `swatch-${index + 1}`,
    name: entry?.name || `Swatches ${index + 1}`,
    colors,
  };
}

function normalizeData(data) {
  return (Array.isArray(data) ? data : [])
    .map(normalizePalette)
    .filter((entry) => entry.colors.length > 0);
}

export function createSwatchesRenderer(options) {
  const base = createBaseRenderer(options);
  const { getData, config } = base;
  const mounts = [];
  let activeColorEditor = null;

  const orientation = config?.swatchOrientation
    || config?.stripOptions?.orientation
    || DEFAULT_SWATCH_ORIENTATION;

  const swatchFeatures = config?.swatchFeatures;
  const hexCopyFirstRowOnly = config?.hexCopyFirstRowOnly === true;
  const verticalMaxPerRow = Number.isFinite(config?.swatchVerticalMaxPerRow)
    ? Math.max(1, Math.min(10, Math.floor(config.swatchVerticalMaxPerRow)))
    : null;

  function getAnchorFromEvent(event, railElement) {
    const path = event.composedPath?.() || [];
    const anchor = path.find((node) => (
      node instanceof HTMLElement
      && (node.tagName === 'BUTTON' || node.classList?.contains('hex-code'))
    ));
    return anchor || railElement;
  }

  function resolveAnchorRect(anchorElement, anchorRectFromDetail) {
    if (anchorRectFromDetail && Number.isFinite(anchorRectFromDetail.left)) {
      return anchorRectFromDetail;
    }
    return anchorElement.getBoundingClientRect();
  }

  function positionPopover(popover, anchorRect) {
    const gap = 8;
    const popRect = popover.getBoundingClientRect();

    let top = anchorRect.bottom + gap;
    if (top + popRect.height > window.innerHeight) {
      top = anchorRect.top - popRect.height - gap;
    }
    top = Math.max(gap, top);

    let left = anchorRect.left + (anchorRect.width - popRect.width) / 2;
    left = Math.max(gap, Math.min(left, window.innerWidth - popRect.width - gap));

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }

  function closeActiveColorEditor() {
    if (!activeColorEditor) return;
    const {
      adapter,
      popover,
      mobile,
      outsideHandler,
      escapeHandler,
      scrollHandler,
    } = activeColorEditor;
    if (outsideHandler) document.removeEventListener('click', outsideHandler, true);
    if (escapeHandler) document.removeEventListener('keydown', escapeHandler, true);
    if (scrollHandler) window.removeEventListener('scroll', scrollHandler, true);
    if (mobile) {
      try {
        adapter.hide?.();
      } catch (_err) {
        // no-op
      }
    }
    adapter.destroy?.();
    popover?.remove();
    activeColorEditor = null;
  }

  function openColorEditorForRail(
    railElement,
    controller,
    selectedIndex,
    anchorElement,
    anchorRectFromDetail = null,
  ) {
    closeActiveColorEditor();

    const state = controller?.getState?.() || {};
    const palette = (state.swatches || []).map((swatch) => swatch?.hex).filter(Boolean);
    const mobile = window.matchMedia?.(MOBILE_BREAKPOINT_QUERY)?.matches === true;

    const adapter = createColorEditAdapter({
      palette,
      selectedIndex,
      colorMode: 'HEX',
      showPalette: true,
      mobile,
    }, {
      onColorChange: ({ hex, index }) => {
        if (!hex || !controller?.setState) return;
        const currentState = controller.getState?.() || {};
        const nextSwatches = [...(currentState.swatches || [])];
        const targetIndex = Number.isInteger(index) ? index : selectedIndex;
        if (targetIndex < 0 || targetIndex >= nextSwatches.length) return;
        nextSwatches[targetIndex] = {
          ...(nextSwatches[targetIndex] || {}),
          hex: hex.toUpperCase(),
        };
        controller.setState({ swatches: nextSwatches });
      },
      onClose: () => {
        closeActiveColorEditor();
      },
    });

    const editorElement = adapter.getElement?.() || adapter.element;
    if (mobile) {
      document.body.appendChild(editorElement);
      adapter.show?.();
      activeColorEditor = { adapter, mobile: true };
      return;
    }

    const popover = document.createElement('div');
    popover.className = 'swatches-color-edit-popover';
    popover.setAttribute('role', 'dialog');
    popover.setAttribute('aria-label', 'Edit color');
    popover.style.position = 'fixed';
    popover.style.zIndex = '10002';
    popover.appendChild(editorElement);
    document.body.appendChild(popover);
    const anchorRect = resolveAnchorRect(anchorElement, anchorRectFromDetail);
    positionPopover(popover, anchorRect);
    requestAnimationFrame(() => positionPopover(popover, anchorRect));
    Promise.resolve(editorElement.updateComplete)
      .then(() => positionPopover(popover, anchorRect))
      .catch(() => {});

    const outsideHandler = (evt) => {
      if (!popover.contains(evt.target) && !anchorElement.contains(evt.target)) {
        closeActiveColorEditor();
      }
    };
    const escapeHandler = (evt) => {
      if (evt.key === 'Escape') closeActiveColorEditor();
    };
    const scrollHandler = () => {
      closeActiveColorEditor();
    };

    document.addEventListener('click', outsideHandler, true);
    document.addEventListener('keydown', escapeHandler, true);
    window.addEventListener('scroll', scrollHandler, true);

    activeColorEditor = {
      adapter,
      popover,
      mobile: false,
      outsideHandler,
      escapeHandler,
      scrollHandler,
    };
  }

  function clearMounts() {
    closeActiveColorEditor();
    while (mounts.length) {
      const mount = mounts.pop();
      mount?.cleanup?.();
      mount?.adapter?.destroy?.();
    }
  }

  function renderSwatches(container, data) {
    clearMounts();
    container.innerHTML = '';

    const palettes = normalizeData(data);
    if (!palettes.length) return;

    palettes.forEach((palette) => {
      const opts = { orientation };
      if (swatchFeatures != null) opts.swatchFeatures = swatchFeatures;
      if (hexCopyFirstRowOnly) opts.hexCopyFirstRowOnly = true;
      if (verticalMaxPerRow != null) opts.verticalMaxPerRow = verticalMaxPerRow;
      const adapter = createSwatchRailAdapter(palette, opts);
      const onEdit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const index = Number(event.detail?.index);
        if (!Number.isInteger(index) || index < 0) return;
        const anchor = getAnchorFromEvent(event, adapter.rail);
        const anchorRect = event.detail?.anchorRect || null;
        openColorEditorForRail(adapter.rail, adapter.rail.controller, index, anchor, anchorRect);
      };
      adapter.rail.addEventListener('color-swatch-rail-edit', onEdit);
      mounts.push({
        adapter,
        cleanup: () => adapter.rail.removeEventListener('color-swatch-rail-edit', onEdit),
      });
      container.appendChild(adapter.element);
    });
  }

  function render(container) {
    renderSwatches(container, getData());
  }

  function update(newData) {
    const mountPoint = options?.container;
    if (!mountPoint) return;
    renderSwatches(mountPoint, newData ?? getData());
  }

  function destroy() {
    closeActiveColorEditor();
    clearMounts();
  }

  return {
    ...base,
    render,
    update,
    destroy,
  };
}

export default createSwatchesRenderer;
