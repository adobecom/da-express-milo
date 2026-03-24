import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createColorConflictsAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import { getConflictPairs, TYPE_ORDER } from '../../scripts/color-shared/services/createColorBlindnessService.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';
import '../../scripts/color-shared/components/color-wheel-express/index.js';

const ACTION_MENU_ID = 'action-menu-color-blindness';
const HISTORY_EVENT = `${ACTION_MENU_ID}:history-index-changed`;

let layoutInstance = null;
let controlsMenu = null;
let stripRenderer = null;
let railUnsub = null;
let controllerUnsubscribe = null;
let historyHandler = null;

function parseContent(block) {
  const layout = {};
  const rows = Array.from(block.children);

  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length < 2) return;

    const key = cols[0].textContent.trim().toLowerCase().replaceAll(/[-_\s]+/g, '');
    const valueCol = cols[1];

    switch (key) {
      case 'pageheading': {
        const h = valueCol.querySelector('h1, h2, h3, h4, h5, h6');
        if (h) layout.heading = h.cloneNode(true);
        break;
      }
      case 'pagesubheading': {
        const p = valueCol.querySelector('p') || valueCol;
        const textContent = p.textContent?.trim();
        if (textContent) {
          layout.paragraph = createTag('p', {}, textContent);
        }
        break;
      }
      default:
        break;
    }
  });

  return { layout };
}

function cleanup() {
  if (historyHandler) {
    document.removeEventListener(HISTORY_EVENT, historyHandler);
    historyHandler = null;
  }
  controllerUnsubscribe?.();
  controllerUnsubscribe = null;
  railUnsub?.();
  railUnsub = null;
  stripRenderer?.destroy();
  stripRenderer = null;
  controlsMenu?.destroy();
  controlsMenu = null;
  layoutInstance?.destroy();
  layoutInstance = null;
}

export default async function decorate(block) {
  cleanup();

  try {
    block.dataset.blockStatus = 'loading';

    const { layout } = parseContent(block);
    block.innerHTML = '';

    const section = createTag('section', { 'aria-label': 'Color blindness simulator' });
    block.appendChild(section);

    const { getResolvedPalette } = createColorPaletteParamApi();
    const initialPalette = { colors: getResolvedPalette() };

    const navLinks = [
      { id: 'palette', label: 'Create palette', href: '/express/colors/color-palette-generator' },
      { id: 'contrast', label: 'Contrast Checker', href: '/express/colors/contrast-checker' },
      { id: 'color-blindness', label: 'Color Blindness Simulator', href: '/express/colors/color-blindness-simulator' },
    ];
    const controls = [
      { id: 'undo', label: 'Undo' },
      { id: 'redo', label: 'Redo' },
    ];

    const isSingleStack = window.matchMedia('(max-width: 887px)').matches;
    const isDesktop = window.matchMedia('(min-width: 1200px)').matches;
    layoutInstance = await createColorToolLayout(section, {
      palette: initialPalette,
      toolbar: {
        variant: isSingleStack ? 'sticky' : 'standalone',
        showEdit: false,
        showPalette: isDesktop,
        showPaletteName: true,
        editPaletteName: false,
      },
      layoutSpans: {
        tablet: { sidebar: 6, canvas: 6 },
        desktop: { sidebar: 3, canvas: 9 },
      },
      actionMenu: {
        id: ACTION_MENU_ID,
        type: 'full',
        activeId: 'color-blindness',
        navLinks,
        controls,
      },
      content: {
        heading: layout.heading,
        paragraph: layout.paragraph,
        icon: true,
      },
    });

    const { sidebar, canvas, topbar } = layoutInstance.slots;
    const layoutRoot = sidebar.parentElement;
    if (layoutRoot && topbar) {
      layoutRoot.insertBefore(sidebar, topbar);
    }
    const actionMenuApi = layoutInstance.actionMenu;
    const conflicts = createColorConflictsAdapter({
      conflictsFound: true,
      label: 'Potential color blind conflicts',
    });
    conflicts.element.setAttribute('tabindex', '0');
    conflicts.element.addEventListener('focus', () => {
      announceToScreenReader('The conflicts between colors are shown with a caution symbol.');
    });
    sidebar.appendChild(conflicts.element);

    const controller = new ColorThemeExpressController({
      swatches: initialPalette.colors,
      harmonyRule: 'CUSTOM',
    });

    let syncingFromRail = false;
    let restoringFromHistory = false;
    let pushingState = false;

    function getCurrentPaletteColors() {
      return (controller.getState()?.swatches || []).map((s) => s.hex);
    }

    function pushCurrentPalette() {
      if (restoringFromHistory) return;
      pushingState = true;
      actionMenuApi?.pushState?.(getCurrentPaletteColors());
      pushingState = false;
    }

    const wheelEl = createTag('color-wheel-express', {
      'aria-label': 'Color wheel',
      color: initialPalette.colors[0],
      tabindex: '0',
    });
    wheelEl.addEventListener('focus', () => {
      announceToScreenReader('Color wheel');
    });
    wheelEl.showLines = true;

    function computeAndSetConflictPairs(colors) {
      const allPairs = [];
      const seen = new Set();
      TYPE_ORDER.forEach((type) => {
        getConflictPairs(colors, type).forEach(([i, j]) => {
          const key = `${i}:${j}`;
          if (!seen.has(key)) { seen.add(key); allPairs.push([i, j]); }
        });
      });
      conflicts.setConflicts(allPairs.length > 0);
      wheelEl.conflictPairs = allPairs;
    }

    function syncRailConflicts() {
      railUnsub?.();
      const rail = canvas.querySelector('color-swatch-rail');
      if (!rail?.controller?.subscribe) return;
      railUnsub = rail.controller.subscribe((state) => {
        const colors = (state.swatches || []).map((s) => s.hex);
        computeAndSetConflictPairs(colors);

        const currentColors = (controller.getState()?.swatches || []).map((s) => s.hex);
        syncingFromRail = true;
        let anyChanged = false;
        colors.forEach((hex, i) => {
          if (hex?.toUpperCase() !== currentColors[i]?.toUpperCase()) {
            controller.setSwatchHex(i, hex);
            anyChanged = true;
          }
        });
        if (anyChanged) {
          layoutInstance.context.set('palette', { ...initialPalette, colors });
        }
        syncingFromRail = false;
      });
    }

    controllerUnsubscribe = controller.subscribe((state) => {
      if (syncingFromRail) return;
      const colors = (state.swatches || []).map((s) => s.hex);
      layoutInstance.context.set('palette', { ...initialPalette, colors });

      computeAndSetConflictPairs(colors);

      stripRenderer?.update([{ ...initialPalette, colors }]);
      syncRailConflicts();
    });

    wheelEl.controller = controller;
    wheelEl.addEventListener('change-end', () => pushCurrentPalette());
    sidebar.appendChild(wheelEl);

    const stripWrapper = createTag('div', { class: 'cb-strip-wrapper' });
    canvas.appendChild(stripWrapper);

    stripRenderer = createStripContainerRenderer({
      data: [initialPalette],
      config: {
        contentMode: 'swatches',
        colorBlindness: true,
        stripContainerOrientations: ['four-rows'],
      },
      onColorChangeEnd: () => pushCurrentPalette(),
    });
    stripRenderer.render(stripWrapper);
    syncRailConflicts();

    const { createActionMenuComponent } = await import(
      '../../scripts/color-shared/components/createActionMenuComponent.js'
    );
    const fullMenuEl = layoutInstance.actionMenu?.element;
    controlsMenu = await createActionMenuComponent({
      id: ACTION_MENU_ID,
      type: 'controls-only',
      controls,
      enableState: false,
      onUndo: () => fullMenuEl?.querySelector('.undo-btn')?.click(),
      onRedo: () => fullMenuEl?.querySelector('.redo-btn')?.click(),
    });
    if (controlsMenu?.element) {
      controlsMenu.element.querySelectorAll('svg [id]').forEach((node) => {
        const oldId = node.id;
        const newId = `${oldId}-cb-controls`;
        node.id = newId;
        controlsMenu.element.querySelectorAll(`[mask="url(#${oldId})"]`).forEach((ref) => {
          ref.setAttribute('mask', `url(#${newId})`);
        });
      });
      canvas.prepend(controlsMenu.element);
    }

    actionMenuApi?.pushState?.(initialPalette.colors);

    historyHandler = () => {
      if (pushingState) return;
      const palette = actionMenuApi?.getCurrentPalette?.();
      if (!palette) return;
      restoringFromHistory = true;
      palette.forEach((hex, i) => controller.setSwatchHex(i, hex));
      restoringFromHistory = false;
    };
    document.addEventListener(HISTORY_EVENT, historyHandler);

    block.classList.add('ax-shell-host');
    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    block.dataset.blockStatus = 'error';
    window.lana?.log(`color-blindness block failed: ${error.message}`, {
      tags: 'color-blindness',
      severity: 'error',
    });
  }
}
