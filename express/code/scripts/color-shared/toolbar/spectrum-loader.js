const SPECTRUM_DIST = '/express/code/scripts/widgets/spectrum/dist';
const COLOR_EXPLORER = '/express/code/blocks/color-explorer';

let loaded = false;

export default async function loadSpectrum() {
  if (loaded) return;
  loaded = true;

  const registry = window.customElements;
  const originalDefine = registry.define.bind(registry);
  registry.define = (name, ctor, opts) => {
    if (registry.get(name)) return;
    originalDefine(name, ctor, opts);
  };

  try {
    await import(`${SPECTRUM_DIST}/lit.js`);
    await import(`${SPECTRUM_DIST}/base.js`);
    await import(`${SPECTRUM_DIST}/theme.js`);
    await import(`${SPECTRUM_DIST}/reactive-controllers.js`);
    await import(`${SPECTRUM_DIST}/shared.js`);
    await import(`${SPECTRUM_DIST}/icons-ui.js`);
    await import(`${SPECTRUM_DIST}/icons-workflow.js`);
    await import(`${SPECTRUM_DIST}/overlay.js`);
    await import(`${SPECTRUM_DIST}/popover.js`);
    await import(`${SPECTRUM_DIST}/menu.js`);
    await import(`${SPECTRUM_DIST}/picker.js`);
    await import(`${COLOR_EXPLORER}/components/s2/spectrum-tags.bundle.js`).catch(() => {});
  } finally {
    registry.define = originalDefine;
  }
}
