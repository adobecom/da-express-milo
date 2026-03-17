import { createTag } from '../../scripts/utils.js';
import createColorToolLayout from '../../scripts/color-shared/shell/layouts/createColorToolLayout.js';
import { isMobileViewport } from '../../scripts/color-shared/utils/utilities.js';
import { createColorConflictsAdapter } from '../../scripts/color-shared/adapters/litComponentAdapters.js';
import ColorThemeController from '../../libs/color-components/controllers/ColorThemeController.js';
import { createStripContainerRenderer } from '../../scripts/color-shared/renderers/createStripContainerRenderer.js';
import { getConflictPairs, TYPE_ORDER } from '../../scripts/color-shared/services/createColorBlindnessService.js';
import '../../libs/color-components/components/color-wheel/index.js';

const PALETTE_PRESETS = [
  { colors: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'], name: 'Coastal Sunset' },
  { colors: ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'], name: 'Earthy Tones' },
  { colors: ['#003049', '#D62828', '#F77F00', '#FCBF49', '#EAE2B7'], name: 'Bold Primary' },
  { colors: ['#5F0F40', '#9A031E', '#FB8B24', '#E36414', '#0F4C5C'], name: 'Autumn Flame' },
  { colors: ['#0B132B', '#1C2541', '#3A506B', '#5BC0BE', '#6FFFE9'], name: 'Ocean Depth' },
  { colors: ['#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF'], name: 'Vivid Spectrum' },
  { colors: ['#CDB4DB', '#FFC8DD', '#FFAFCC', '#BDE0FE', '#A2D2FF'], name: 'Pastel Dream' },
  { colors: ['#10002B', '#240046', '#3C096C', '#5A189A', '#9D4EDD'], name: 'Purple Haze' },
];

function pickRandomPalette() {
  return PALETTE_PRESETS[Math.floor(Math.random() * PALETTE_PRESETS.length)];
}

let layoutInstance = null;
let stripRenderer = null;
let railUnsub = null;
let controllerUnsubscribe = null;

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
  controllerUnsubscribe?.();
  controllerUnsubscribe = null;
  railUnsub?.();
  railUnsub = null;
  stripRenderer?.destroy();
  stripRenderer = null;
  layoutInstance?.destroy();
  layoutInstance = null;
}

export default async function decorate(block) {
  cleanup();

  try {
    block.dataset.blockStatus = 'loading';

    const { layout } = parseContent(block);
    block.innerHTML = '';

    const initialPalette = pickRandomPalette();

    layoutInstance = await createColorToolLayout(block, {
      palette: initialPalette,
      toolbar: {
        variant: isMobileViewport() ? 'sticky' : 'standalone',
        showEdit: false,
        showPalette: true,
        showPaletteName: isMobileViewport(),
        editPaletteName: false,
      },
      actionMenu: {
        id: 'action-menu-color-blindness',
        type: 'full',
        activeId: 'color-blindness',
        navLinks: [
          { id: 'palette', label: 'Create palette', href: '/express/colors/color-palette-generator' },
          { id: 'contrast', label: 'Contrast Checker', href: '/express/colors/contrast-checker' },
          { id: 'color-blindness', label: 'Color Blindness Simulator', href: '/express/colors/color-blindness-simulator' },
        ],
        controls: [
          { id: 'undo', label: 'Undo' },
          { id: 'redo', label: 'Redo' },
        ],
      },
      content: {
        heading: layout.heading,
        paragraph: layout.paragraph,
        icon: true,
      },
    });

    const { sidebar, canvas } = layoutInstance.slots;
    const conflicts = createColorConflictsAdapter({
      conflictsFound: true,
      label: 'Potential color blind conflicts',
    });
    sidebar.appendChild(conflicts.element);

    const controller = new ColorThemeController({
      swatches: initialPalette.colors,
      harmonyRule: 'CUSTOM',
    });

    function syncRailConflicts() {
      railUnsub?.();
      const rail = canvas.querySelector('color-swatch-rail');
      if (!rail?.controller?.subscribe) return;
      railUnsub = rail.controller.subscribe((state) => {
        const colors = (state.swatches || []).map((s) => s.hex);
        const hasConflicts = TYPE_ORDER.some(
          (type) => getConflictPairs(colors, type).length > 0,
        );
        conflicts.setConflicts(hasConflicts);
      });
    }

    controllerUnsubscribe = controller.subscribe((state) => {
      const colors = (state.swatches || []).map((s) => s.hex);
      layoutInstance.context.set('palette', { ...initialPalette, colors });

      const hasConflicts = TYPE_ORDER.some((type) => getConflictPairs(colors, type).length > 0);
      conflicts.setConflicts(hasConflicts);

      stripRenderer?.update([{ ...initialPalette, colors }]);
      syncRailConflicts();
    });

    const wheelEl = createTag('color-wheel', {
      'aria-label': 'Color wheel',
      color: initialPalette.colors[0],
    });
    wheelEl.controller = controller;
    sidebar.appendChild(wheelEl);

    stripRenderer = createStripContainerRenderer({
      data: [initialPalette],
      config: {
        contentMode: 'swatches',
        colorBlindness: true,
        stripContainerOrientations: ['four-rows'],
      },
    });
    stripRenderer.render(canvas);
    syncRailConflicts();

    block.classList.add('ax-shell-host');
    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    block.dataset.blockStatus = 'error';
  }
}
