// eslint-disable-next-line import/no-unresolved, import/no-absolute-path
const { mountLoadingScreenDemo } = await import('/express/code/blocks/color-explore/color-explore.js');

const DEMO_STYLE_ID = 'color-explore-loading-only-demo-styles';
const DEMO_ROOT_ID = 'color-explore-loading-only-demo';

const mounts = [];

function ensureDemoStyles() {
  if (document.getElementById(DEMO_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = DEMO_STYLE_ID;
  style.textContent = `
    #${DEMO_ROOT_ID} {
      max-width: 1600px;
      margin: 24px auto;
      padding: 0 16px;
      display: grid;
      gap: 24px;
      font-family: system-ui, sans-serif;
    }
    #${DEMO_ROOT_ID} .demo-card,
    #${DEMO_ROOT_ID} .demo-intro {
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      padding: 16px;
    }
    #${DEMO_ROOT_ID} .demo-intro h2 {
      margin: 0 0 8px;
      font-size: 20px;
      line-height: 1.2;
    }
    #${DEMO_ROOT_ID} .demo-intro p,
    #${DEMO_ROOT_ID} .demo-card p {
      margin: 0;
      color: #5b5b5b;
      font-size: 14px;
      line-height: 1.4;
    }
    #${DEMO_ROOT_ID} .demo-controls {
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    #${DEMO_ROOT_ID} .demo-btn {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 600;
      background: #1473e6;
      color: #fff;
      cursor: pointer;
    }
    #${DEMO_ROOT_ID} .demo-caption {
      margin: 0;
      font-size: 13px;
      color: #666;
    }
    #${DEMO_ROOT_ID} .demo-card h3 {
      margin: 0 0 6px;
      font-size: 16px;
      line-height: 1.3;
    }
    #${DEMO_ROOT_ID} .demo-slot {
      margin-top: 12px;
      border: 1px dashed #d5d5d5;
      border-radius: 10px;
      overflow: clip;
      background: #fff;
    }
  `;
  document.head.appendChild(style);
}

function createDemoRoot() {
  const root = document.createElement('section');
  root.id = DEMO_ROOT_ID;
  root.innerHTML = `
    <div class="demo-intro">
      <h2>Color Explore Loading Screen Demo</h2>
      <p>Loading-only mode using <code>color-explore.js</code>. No gradients/palettes renderer is executed.</p>
      <div class="demo-controls">
        <button type="button" class="demo-btn" id="${DEMO_ROOT_ID}-rerun">Re-run loading screen</button>
        <p class="demo-caption" id="${DEMO_ROOT_ID}-viewport" aria-live="polite"></p>
      </div>
    </div>
    <div class="demo-card">
      <h3>Palettes Loading Skeleton</h3>
      <p>Shared loading component mounted via <code>mountLoadingScreenDemo(...)</code> with strips variant.</p>
      <div class="demo-slot" id="${DEMO_ROOT_ID}-slot-palettes"></div>
    </div>
    <div class="demo-card">
      <h3>Gradients Loading Skeleton</h3>
      <p>Shared loading component mounted via <code>mountLoadingScreenDemo(...)</code> with gradients variant.</p>
      <div class="demo-slot" id="${DEMO_ROOT_ID}-slot-gradients"></div>
    </div>
  `;
  return root;
}

function ensureDemoRoot() {
  const existing = document.getElementById(DEMO_ROOT_ID);
  if (existing) return existing;
  const root = createDemoRoot();
  document.body.appendChild(root);
  return root;
}

function updateViewportLabel(root) {
  const label = root.querySelector(`#${DEMO_ROOT_ID}-viewport`);
  if (!label) return;
  label.textContent = `Viewport width: ${Math.round(window.innerWidth)}px`;
}

function clearMountedDemos(root) {
  mounts.splice(0).forEach((mount) => mount.destroy?.());
  const slotPalettes = root.querySelector(`#${DEMO_ROOT_ID}-slot-palettes`);
  const slotGradients = root.querySelector(`#${DEMO_ROOT_ID}-slot-gradients`);
  if (slotPalettes) slotPalettes.innerHTML = '';
  if (slotGradients) slotGradients.innerHTML = '';
}

function mountVariantDemo(root, slotId, variant, cardCount = 9) {
  const slot = root.querySelector(`#${slotId}`);
  if (!slot) return;
  const block = document.createElement('div');
  slot.appendChild(block);
  mounts.push(mountLoadingScreenDemo(block, { variant, cardCount }));
}

function rerunDemo(root) {
  clearMountedDemos(root);
  mountVariantDemo(root, `${DEMO_ROOT_ID}-slot-palettes`, 'strips', 9);
  mountVariantDemo(root, `${DEMO_ROOT_ID}-slot-gradients`, 'gradients', 9);
  updateViewportLabel(root);
}

function init() {
  ensureDemoStyles();
  const root = ensureDemoRoot();
  rerunDemo(root);

  root.querySelector(`#${DEMO_ROOT_ID}-rerun`)?.addEventListener('click', () => {
    rerunDemo(root);
  });

  window.addEventListener('resize', () => {
    updateViewportLabel(root);
  });
}

init();
