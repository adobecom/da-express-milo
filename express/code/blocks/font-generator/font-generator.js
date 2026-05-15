import STYLES from './unicode-styles.js';

const FONT_SIZE_DEFAULT = 32;

// Debounce helper — delays fn execution until ms after last call.
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export default async function init(el) {
  // Block is code-driven — clear authored placeholder content.
  el.replaceChildren();

  // Lazy-load components inside init() so they don't block Phase E.
  const [
    { createSidePanel },
    { createPreviewGrid },
  ] = await Promise.all([
    import('./components/createSidePanel.js'),
    import('./components/createPreviewGrid.js'),
  ]);

  // Create Spectrum theme wrapper for the entire block.
  // sp-theme is registered by loadTextfield() → loadCoreDeps() inside createSidePanel.
  // We build the grid first (synchronous), then await the panel (async Spectrum loading).
  const grid = createPreviewGrid(STYLES);

  const container = document.createElement('div');
  container.className = 'font-generator-container';
  el.appendChild(container);

  const state = { text: 'Hello', category: 'All', fontSize: FONT_SIZE_DEFAULT };

  // Debounced grid update — 20 ms delay is fast enough for real-time feel without
  // every keypress triggering a full unicode transform across all cards.
  const scheduleUpdate = debounce(() => {
    grid.update(state.text, state.category, state.fontSize);
  }, 20);

  function onStateChange(updates) {
    Object.assign(state, updates);
    scheduleUpdate();
  }

  // Load the side panel (awaits Spectrum bundle loading internally).
  const { panel } = await createSidePanel({ onStateChange, styleCount: STYLES.length });

  // Wrap both columns in a single sp-theme context.
  // sp-theme is registered by this point (createSidePanel awaited loadTextfield which loads theme.js).
  const theme = document.createElement('sp-theme');
  theme.setAttribute('system', 'spectrum-two');
  theme.setAttribute('color', 'light');
  theme.setAttribute('scale', 'medium');

  theme.append(panel, grid.element);
  container.appendChild(theme);

  // Initial render with default state.
  grid.update(state.text, state.category, state.fontSize);
}
