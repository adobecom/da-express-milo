import { createTag } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createColorConflictsAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import { getConflictPairs, TYPE_ORDER } from '../../scripts/color-shared/services/createColorBlindnessService.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';
import adoptHeadline from '../../scripts/color-shared/utils/adoptHeadline.js';
import '../../scripts/color-shared/components/color-wheel-express/index.js';

const ACTION_MENU_ID = 'action-menu-color-blindness';
const HISTORY_EVENT = `${ACTION_MENU_ID}:history-index-changed`;

let layoutInstance = null;
let controlsMenu = null;
let stripRenderer = null;
let railUnsub = null;
let controllerUnsubscribe = null;
let historyHandler = null;

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

    block.innerHTML = '';

    const section = createTag('section', { 'aria-label': 'Color blindness simulator' });
    block.appendChild(section);

    const {
      getResolvedPalette, getResolvedPaletteName, getBaseColor,
    } = createColorPaletteParamApi();
    const paletteColors = getResolvedPalette();
    const baseColorHex = getBaseColor();
    const baseColorIndex = baseColorHex
      ? paletteColors.findIndex((c) => c.toUpperCase() === baseColorHex.toUpperCase())
      : -1;
    const hasValidBaseColor = baseColorIndex >= 0;
    const initialPalette = {
      name: getResolvedPaletteName() || 'My Color Theme',
      colors: paletteColors,
      ...(hasValidBaseColor && { baseColorIndex }),
    };

    const navLinks = [
      { id: 'palette', label: 'Create palette', href: '/express/colors/color-palette-generator' },
      { id: 'contrast', label: 'Contrast Checker', href: '/express/colors/color-contrast-checker' },
      { id: 'color-blindness', label: 'Color Blindness Simulator', href: '/express/colors/color-blindness-simulator' },
    ];
    const controls = [
      { id: 'undo', label: 'Undo' },
      { id: 'redo', label: 'Redo' },
    ];

    const isDesktop = window.matchMedia('(min-width: 1200px)').matches;
    layoutInstance = await createColorToolLayout(section, {
      palette: initialPalette,
      toolbar: {
        variant: 'standalone',
        mode: 'sticky-on-scroll',
        showEdit: false,
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
    });

    adoptHeadline(block, layoutInstance);
    await layoutInstance.actionMenuReady;

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

    const getCurrentPaletteColors = () => (controller.getState()?.swatches || []).map((s) => s.hex);

    const pushCurrentPalette = () => {
      if (restoringFromHistory) return;
      pushingState = true;
      actionMenuApi?.pushState?.(getCurrentPaletteColors());
      pushingState = false;
    };

    const wheelEl = createTag('color-wheel-express', {
      'aria-label': 'Color wheel',
      color: initialPalette.colors[0],
      tabindex: '0',
    });
    wheelEl.addEventListener('focus', () => {
      announceToScreenReader('Color wheel');
    });
    wheelEl.showLines = true;

    const computeAndSetConflictPairs = (colors) => {
      const allPairs = [];
      const seen = new Set();
      TYPE_ORDER.forEach((type) => {
        getConflictPairs(colors, type).forEach(([i, j]) => {
          const key = `${i}:${j}`;
          if (!seen.has(key)) {
            seen.add(key);
            allPairs.push([i, j]);
          }
        });
      });
      conflicts.setConflicts(allPairs.length > 0);
      wheelEl.conflictPairs = allPairs;
    };

    const syncRailConflicts = () => {
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
    };

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
        swatchFeatures: hasValidBaseColor
          ? { baseColor: false, baseColorReadOnly: true }
          : { baseColor: false },
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
    trackColorBlockLoad('color-blindness');
  } catch (error) {
    block.dataset.blockStatus = 'error';
    window.lana?.log(`color-blindness block failed: ${error.message}`, {
      tags: 'color-blindness',
      severity: 'error',
    });
  }
}
