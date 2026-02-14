/**
 * Dev-only: log modal container dimensions at open to verify breakpoints.
 * Enable with ?modaldebug=1 in the URL. Compares computed dimensions to spec (MWPW-185800).
 */
const SPEC = {
  mobile: {
    maxWidth: '600px',
    maxHeight: '90vh',
    note: 'Drawer: bottom sheet, max-width 600px, max-height 90vh',
  },
  tablet: {
    width: '536px',
    minHeight: 'min(600px, 90vh)',
    maxHeight: '90vh',
    note: '768px+: .ax-color-drawer-modal-container Figma M 536×600, max-height 90vh',
  },
  desktop: {
    width: '898px',
    height: '604px',
    note: '1024px+: .ax-color-drawer-modal-container and .ax-color-modal-container 898×604',
  },
  desktopShort: {
    maxHeight: '85vh',
    note: '1024px + viewport height ≤768: .ax-color-modal-container height auto, max-height 85vh',
  },
};

function getBreakpoint(vw, vh) {
  if (vw >= 1024) return vh <= 768 ? 'desktopShort' : 'desktop';
  if (vw >= 768) return 'tablet';
  return 'mobile';
}

/**
 * Viewport, breakpoint, and container dimensions (dev only; no console). Call after modal open.
 * @param {HTMLElement} container - .ax-color-drawer-modal-container or .ax-color-modal-container
 * @param {string} type - 'drawer' | 'standard'
 */
/* eslint-disable import/prefer-default-export -- named export for tree-shake and clarity */
export function logModalDimensions(container, type = 'drawer') {
  if (typeof window === 'undefined' || !container) return undefined;
  const params = new URLSearchParams(window.location.search);
  if (!params.get('modaldebug')) return undefined;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const breakpoint = getBreakpoint(vw, vh);
  const spec = SPEC[breakpoint] || SPEC.mobile;
  const style = window.getComputedStyle(container);

  const { width } = style;
  const { height } = style;
  const { maxWidth } = style;
  const { maxHeight } = style;
  const { minHeight } = style;

  const out = {
    viewport: `${vw}×${vh}`,
    breakpoint,
    type,
    computed: { width, height, maxWidth, maxHeight, minHeight },
    spec,
  };
  return out; // no console; caller can use when ?modaldebug=1
}
