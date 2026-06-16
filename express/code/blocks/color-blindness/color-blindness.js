import { createTag, getLibs } from '../../scripts/utils.js';
import { trackColorBlockLoad } from '../../scripts/instrument.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { createColorConflictsAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';
import ColorThemeExpressController from '../../scripts/color-shared/controllers/ColorThemeExpressController.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import { getConflictPairs, TYPE_ORDER } from '../../scripts/color-shared/services/createColorBlindnessService.js';
import { announceToScreenReader } from '../../scripts/color-shared/spectrum/utils/a11y.js';
import { createColorPaletteParamApi } from '../../scripts/color-shared/utils/utilities.js';
import adoptHeadline from '../../scripts/color-shared/utils/adoptHeadline.js';
import loadColorBlindnessPlaceholders from '../../scripts/color-shared/i18n/loadColorBlindnessPlaceholders.js';
import loadBaseColorPlaceholders from '../../scripts/color-shared/i18n/loadBaseColorPlaceholders.js';
import loadColorEditPlaceholders from '../../scripts/color-shared/i18n/loadColorEditPlaceholders.js';
import loadColorSwatchRailPlaceholders from '../../scripts/color-shared/i18n/loadColorSwatchRailPlaceholders.js';
import '../../scripts/color-shared/components/color-wheel-express/index.js';

const ACTION_MENU_ID = 'action-menu-color-blindness';
const HISTORY_EVENT = `${ACTION_MENU_ID}:history-index-changed`;

// A palette is color-blind safe when no two colors conflict under any of the
// simulated CVD types. Surfaced via the palette context so a theme saved from
// here is tagged `colorblind-safe` (drives the libraries grid badge).
function isColorBlindSafe(colors) {
  return TYPE_ORDER.every((type) => getConflictPairs(colors, type).length === 0);
}

let layoutInstance = null;
let controlsMenu = null;
let stripRenderer = null;
let railUnsub = null;
let cachedRailController = null;
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
  cachedRailController = null;
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

    const [
      cbStrings,
      baseColorStrings,
      colorEditStrings,
      colorSwatchRailStrings,
    ] = await Promise.all([
      loadColorBlindnessPlaceholders(),
      loadBaseColorPlaceholders(),
      loadColorEditPlaceholders(),
      loadColorSwatchRailPlaceholders(),
    ]);
    const { shared, block: blockStrings } = cbStrings;

    const section = createTag('section', { 'aria-label': blockStrings.sectionAria });
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
      name: getResolvedPaletteName() || '',
      colors: paletteColors,
      accessibilityData: { colorBlindSafe: isColorBlindSafe(paletteColors) },
      ...(hasValidBaseColor && { baseColorIndex }),
    };

    const { getConfig } = await import(`${getLibs()}/utils/utils.js`);
    const { locale } = getConfig();
    const navLinks = [
      { id: 'palette', label: blockStrings.navCreatePalette, href: `${locale.contentRoot}/create/color-wheel` },
      { id: 'contrast', label: blockStrings.navContrastChecker, href: `${locale.contentRoot}/create/color-contrast-analyzer` },
      { id: 'color-blindness', label: blockStrings.navColorBlindness, href: `${locale.contentRoot}/create/color-accessibility` },
    ];
    const controls = [
      { id: 'undo', label: blockStrings.controlUndo },
      { id: 'redo', label: blockStrings.controlRedo },
    ];

    layoutInstance = await createColorToolLayout(section, {
      palette: initialPalette,
      toolbar: {
        daaLh: 'color-blindness',
        variant: 'sticky-on-scroll',
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
        daaLh: 'color-blindness',
      },
    });

    await layoutInstance.actionMenuReady;

    const { sidebar, canvas, topbar } = layoutInstance.slots;
    const layoutRoot = sidebar.parentElement;
    if (layoutRoot && topbar) {
      layoutRoot.insertBefore(sidebar, topbar);
    }
    const actionMenuApi = layoutInstance.actionMenu;
    const conflicts = createColorConflictsAdapter({
      conflictsFound: true,
      label: shared.summary,
      strings: shared,
    });
    conflicts.element.setAttribute('tabindex', '0');
    conflicts.element.addEventListener('focus', () => {
      announceToScreenReader(blockStrings.conflictsFocusAnnouncement);
    });
    sidebar.appendChild(conflicts.element);

    const controller = new ColorThemeExpressController({
      swatches: initialPalette.colors,
      harmonyRule: 'CUSTOM',
    });

    let syncingFromRail = false;
    let syncingFromController = false;
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
      'aria-label': blockStrings.wheelAria,
      color: initialPalette.colors[0],
      tabindex: '0',
    });
    wheelEl.addEventListener('focus', () => {
      announceToScreenReader(blockStrings.wheelFocusAnnouncement);
    });
    wheelEl.showLines = true;
    if (blockStrings.markerAriaTemplate) {
      wheelEl.markerAriaTemplate = blockStrings.markerAriaTemplate;
    }

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
      return allPairs.length === 0;
    };

    const syncRailConflicts = () => {
      const rail = canvas.querySelector('color-swatch-rail');
      const railController = rail?.controller;
      if (!railController?.subscribe) {
        railUnsub?.();
        railUnsub = null;
        cachedRailController = null;
        return;
      }
      // Controller hasn't changed — already subscribed, nothing to do.
      if (railController === cachedRailController) return;
      railUnsub?.();
      cachedRailController = railController;
      railUnsub = railController.subscribe((state) => {
        // Skip when this fired because we pushed an update from the main controller.
        // computeAndSetConflictPairs was already called before stripRenderer.update().
        if (syncingFromController) return;
        const colors = (state.swatches || []).map((s) => s.hex);
        const cbSafe = computeAndSetConflictPairs(colors);

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
          layoutInstance.context.set('palette', {
            ...initialPalette,
            colors,
            accessibilityData: { colorBlindSafe: cbSafe },
          });
        }
        syncingFromRail = false;
      });
    };

    controllerUnsubscribe = controller.subscribe((state) => {
      if (syncingFromRail) return;
      const colors = (state.swatches || []).map((s) => s.hex);
      const cbSafe = computeAndSetConflictPairs(colors);
      layoutInstance.context.set('palette', {
        ...initialPalette,
        colors,
        accessibilityData: { colorBlindSafe: cbSafe },
      });

      syncingFromController = true;
      stripRenderer?.update([{ ...initialPalette, colors }]);
      syncingFromController = false;
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
        colorBlindnessStrings: shared,
        colorEditStrings,
        baseColorStrings,
        colorSwatchRailStrings,
      },
      onColorChangeEnd: () => pushCurrentPalette(),
      onEditOpen: (index) => controller.setActiveSwatchIndex(index),
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
      daaLh: 'color-blindness',
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

    adoptHeadline(block, layoutInstance);
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
