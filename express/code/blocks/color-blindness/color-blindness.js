import { createSwatchesRenderer } from '../../scripts/color-shared/renderers/createSwatchesRenderer.js';
import { createColorPaletteParamApi, PALETTE_PRESETS } from '../../scripts/color-shared/utils/utilities.js';

const api = createColorPaletteParamApi();
const renderers = [];

function destroyRenderers() {
  renderers.forEach((r) => r.destroy());
  renderers.length = 0;
}

function createSection(title) {
  const section = document.createElement('div');
  section.className = 'cb-section';
  const heading = document.createElement('h3');
  heading.className = 'cb-section-heading';
  heading.textContent = title;
  section.appendChild(heading);
  const content = document.createElement('div');
  content.className = 'cb-section-content';
  section.appendChild(content);
  return { section, content };
}

export default async function decorate(block) {
  try {
    destroyRenderers();
    block.dataset.blockStatus = 'loading';
    block.innerHTML = '';

    const colors = api.getResolvedPalette();
    const palette = { colors, name: 'Palette' };

    const { section: activeSection, content: activeContent } = createSection('Active Palette');
    block.appendChild(activeSection);

    const activeRenderer = createSwatchesRenderer({
      data: [palette],
      config: {
        swatchOrientation: 'horizontal',
        swatchFeatures: { hexCode: true, copy: true },
      },
    });
    activeRenderer.render(activeContent);
    renderers.push(activeRenderer);

    const { section: presetsSection, content: presetsContent } = createSection('Content Team Palettes');
    block.appendChild(presetsSection);

    const presetsRenderer = createSwatchesRenderer({
      data: PALETTE_PRESETS.map((p, i) => ({ colors: p.colors, name: `Palette ${i + 1}` })),
      config: {
        swatchOrientation: 'horizontal',
        swatchFeatures: { hexCode: true, copy: true },
      },
    });
    presetsRenderer.render(presetsContent);
    renderers.push(presetsRenderer);

    block.dataset.blockStatus = 'loaded';
  } catch (error) {
    block.dataset.blockStatus = 'error';
    window.lana?.log(`color-blindness block failed: ${error.message}`, {
      tags: 'color-blindness',
      severity: 'error',
    });
  }
}
