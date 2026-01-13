import { getLibs, addTempWrapperDeprecated } from '../../scripts/utils.js';

let createTag;
let getConfig;

const GRADIENT_API_ENDPOINTS = {
  stage: 'https://color-stage.adobe.io/api/v1/gradients',
  prod: 'https://color.adobe.io/api/v1/gradients',
};

const GRADIENT_API_KEY = 'express-color-gradient-api';

class GradientData {
  constructor(data) {
    this.id = data.id;
    this.name = data.name || 'Unnamed Gradient';
    this.type = data.type || 'linear';
    this.colorStops = data.colorStops || [];
    this.coreColors = data.coreColors || this.extractCoreColors();
    this.tags = data.tags || [];
    this.thumbnail = data.thumbnail || null;
  }

  extractCoreColors() {
    if (this.colorStops.length === 0) return [];

    const evenlyCopaced = [];
    const totalStops = Math.min(5, this.colorStops.length);
    const step = this.colorStops.length / totalStops;

    for (let i = 0; i < totalStops; i += 1) {
      const index = Math.floor(i * step);
      evenlyCopaced.push(this.colorStops[index].color);
    }

    return evenlyCopaced;
  }

  toPalette() {
    return {
      id: `${this.id}-palette`,
      name: `${this.name} Palette`,
      colors: this.coreColors,
      source: 'gradient',
      sourceId: this.id,
    };
  }
}

async function fetchGradientData(params = {}) {
  const config = getConfig();
  const env = config?.env?.name || 'prod';
  const endpoint = GRADIENT_API_ENDPOINTS[env === 'prod' ? 'prod' : 'stage'];

  const queryParams = new URLSearchParams({
    limit: params.limit || 24,
    offset: params.offset || 0,
    excludeCreativeProjects: 'true',
    excludeStockPhotos: 'true',
    ...params.filters,
  });

  try {
    const response = await fetch(`${endpoint}?${queryParams}`, {
      headers: {
        'x-api-key': GRADIENT_API_KEY,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Gradient API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.gradients || []).map((g) => new GradientData(g));
  } catch (error) {
    window.lana?.log(`Error fetching gradients: ${error.message}`);
    return [];
  }
}

function createGradientCSS(gradient) {
  const { type, colorStops } = gradient;
  const direction = type === 'radial' ? 'circle' : '90deg';
  const stops = colorStops
    .map((stop) => `${stop.color} ${stop.position * 100}%`)
    .join(', ');

  return type === 'radial'
    ? `radial-gradient(${direction}, ${stops})`
    : `linear-gradient(${direction}, ${stops})`;
}

function showToast(message, type = 'success') {
  const toast = createTag('div', { class: `gradient-toast ${type}` });
  toast.textContent = message;
  document.body.append(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Link copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy link', 'error');
  });
}

function openPaletteEditor(gradient) {
  const palette = gradient.toPalette();
  const colors = encodeURIComponent(JSON.stringify(palette.colors));
  window.location.href = `/express/colors/palette-editor?colors=${colors}&source=gradient&sourceId=${gradient.id}`;
}

function openInExpress(gradient) {
  const palette = gradient.toPalette();
  const colors = encodeURIComponent(JSON.stringify(palette.colors));
  const expressURL = `https://new.express.adobe.com/?palette=${colors}`;

  window.open(expressURL, '_blank');
}

function downloadGradient(gradient) {
  const data = {
    name: gradient.name,
    type: gradient.type,
    colorStops: gradient.colorStops,
    coreColors: gradient.coreColors,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = createTag('a', { href: url, download: `${gradient.name}.json` });
  a.click();
  URL.revokeObjectURL(url);

  showToast('Gradient downloaded!');
}

function shareGradient(gradient) {
  const shareURL = `${window.location.origin}/express/colors/gradients/${gradient.id}`;

  if (navigator.share) {
    navigator.share({
      title: gradient.name,
      text: `Check out this gradient: ${gradient.name}`,
      url: shareURL,
    }).catch(() => {
      copyToClipboard(shareURL);
    });
  } else {
    copyToClipboard(shareURL);
  }
}

async function createDefaultLibrary(token) {
  const librariesEndpoint = 'https://cc-libraries.adobe.io/api/v1/libraries';
  const response = await fetch(librariesEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-api-key': GRADIENT_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'My Library',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create library');
  }

  return response.json();
}

async function promptLogin(context) {
  const currentURL = window.location.href;
  const returnURL = `${currentURL}${currentURL.includes('?') ? '&' : '?'}gradient-context=${context}`;

  window.adobeIMS?.signIn({
    redirect_uri: returnURL,
  });
}

async function saveToLibraries(gradient) {
  if (!window.adobeIMS?.isSignedInUser()) {
    await promptLogin('save');
    if (!window.adobeIMS?.isSignedInUser()) {
      return;
    }
  }

  try {
    const token = window.adobeIMS?.getAccessToken()?.token;
    if (!token) {
      throw new Error('No auth token available');
    }

    const librariesEndpoint = 'https://cc-libraries.adobe.io/api/v1/libraries';

    const libraries = await fetch(librariesEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': GRADIENT_API_KEY,
      },
    });

    if (!libraries.ok) {
      throw new Error('Failed to fetch libraries');
    }

    const libsData = await libraries.json();
    const targetLibrary = libsData.libraries?.[0] || await createDefaultLibrary(token);

    const gradientData = {
      name: gradient.name,
      type: 'gradient',
      data: {
        type: gradient.type,
        colorStops: gradient.colorStops,
      },
      tags: gradient.tags,
    };

    const saveResponse = await fetch(`${librariesEndpoint}/${targetLibrary.id}/elements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-api-key': GRADIENT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradientData),
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save gradient');
    }

    showToast('Gradient saved to CC Libraries!');
  } catch (error) {
    window.lana?.log(`Error saving to libraries: ${error.message}`);
    showToast('Failed to save gradient. Please try again.', 'error');
  }
}

function createGradientActions(gradient) {
  const actionsContainer = createTag('div', { class: 'gradient-actions' });

  const saveBtn = createTag('button', { class: 'button primary' });
  saveBtn.textContent = 'Save to CC Libraries';
  saveBtn.addEventListener('click', () => saveToLibraries(gradient));

  const shareBtn = createTag('button', { class: 'button secondary' });
  shareBtn.textContent = 'Share';
  shareBtn.addEventListener('click', () => shareGradient(gradient));

  const downloadBtn = createTag('button', { class: 'button secondary' });
  downloadBtn.textContent = 'Download';
  downloadBtn.addEventListener('click', () => downloadGradient(gradient));

  const expressBtn = createTag('button', { class: 'button accent' });
  expressBtn.textContent = 'Open in Adobe Express';
  expressBtn.addEventListener('click', () => openInExpress(gradient));

  const paletteBtn = createTag('button', { class: 'button secondary' });
  paletteBtn.textContent = 'Edit as Palette';
  paletteBtn.addEventListener('click', () => openPaletteEditor(gradient));

  actionsContainer.append(saveBtn, shareBtn, downloadBtn, expressBtn, paletteBtn);

  return actionsContainer;
}

function createGradientModalContent(gradient) {
  const container = createTag('div', { class: 'gradient-modal-content' });

  const header = createTag('div', { class: 'gradient-modal-header' });
  const title = createTag('h2');
  title.textContent = gradient.name;
  header.append(title);

  const gradientDisplay = createTag('div', { class: 'gradient-modal-display' });
  const visual = createTag('div', { class: 'gradient-visual-large' });
  visual.style.background = createGradientCSS(gradient);

  const colorHandles = createTag('div', { class: 'gradient-handles' });
  gradient.colorStops.forEach((stop) => {
    const handle = createTag('div', {
      class: 'color-handle',
      style: `left: ${stop.position * 100}%; background-color: ${stop.color}`,
    });
    colorHandles.append(handle);
  });
  visual.append(colorHandles);
  gradientDisplay.append(visual);

  const paletteSection = createTag('div', { class: 'gradient-palette-section' });
  const paletteTitle = createTag('h3');
  paletteTitle.textContent = 'Core Colors';
  const paletteColors = createTag('div', { class: 'palette-colors' });

  gradient.coreColors.forEach((color) => {
    const colorSwatch = createTag('div', {
      class: 'color-swatch',
      style: `background-color: ${color}`,
      title: color,
    });
    const colorLabel = createTag('span', { class: 'color-label' });
    colorLabel.textContent = color;
    const colorItem = createTag('div', { class: 'color-item' });
    colorItem.append(colorSwatch, colorLabel);
    paletteColors.append(colorItem);
  });

  paletteSection.append(paletteTitle, paletteColors);

  const actions = createGradientActions(gradient);

  container.append(header, gradientDisplay, paletteSection, actions);

  return container;
}

function createGradientCard(gradient) {
  const card = createTag('div', {
    class: 'gradient-card',
    'data-gradient-id': gradient.id,
    role: 'button',
    tabindex: '0',
    'aria-label': `${gradient.name} gradient`,
  });

  const visual = createTag('div', { class: 'gradient-visual' });

  const gradientCSS = gradient.colorStops.length > 0
    ? createGradientCSS(gradient)
    : 'linear-gradient(90deg, #ccc 0%, #eee 100%)';

  visual.style.background = gradientCSS;

  const colorHandles = createTag('div', { class: 'gradient-handles' });
  gradient.colorStops.forEach((stop) => {
    const handle = createTag('div', {
      class: 'color-handle',
      style: `left: ${stop.position * 100}%; background-color: ${stop.color}`,
      'data-color': stop.color,
      'data-position': stop.position,
      title: stop.color,
    });
    colorHandles.append(handle);
  });

  visual.append(colorHandles);

  const info = createTag('div', { class: 'gradient-info' });
  const name = createTag('p', { class: 'gradient-name' });
  name.textContent = gradient.name;
  info.append(name);

  card.append(visual, info);

  card.addEventListener('click', () => {
    // eslint-disable-next-line no-use-before-define
    openGradientModal(gradient);
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // eslint-disable-next-line no-use-before-define
      openGradientModal(gradient);
    }
  });

  return card;
}

async function openGradientModal(gradient) {
  const { getModal } = await import(`${getLibs()}/blocks/modal/modal.js`);

  const modalContent = createGradientModalContent(gradient);

  const modal = await getModal(null, {
    id: `gradient-modal-${gradient.id}`,
    class: 'gradient-modal',
    content: modalContent,
    closeEvent: 'closeGradientModal',
  });

  return modal;
}

function applyAutoTags(gradients) {
  return gradients.map((gradient) => {
    if (!gradient.tags || gradient.tags.length === 0) {
      const autoTags = [];
      
      const colors = gradient.coreColors;
      if (colors.length > 0) {
        const avgBrightness = colors.reduce((sum, color) => {
          const rgb = parseInt(color.slice(1), 16);
          // eslint-disable-next-line no-bitwise
          const r = (rgb >> 16) & 255;
          // eslint-disable-next-line no-bitwise
          const g = (rgb >> 8) & 255;
          // eslint-disable-next-line no-bitwise
          const b = rgb & 255;
          return sum + (0.299 * r + 0.587 * g + 0.114 * b);
        }, 0) / colors.length;

        if (avgBrightness > 180) autoTags.push('light');
        else if (avgBrightness < 80) autoTags.push('dark');
      }

      gradient.tags = [...autoTags, ...gradient.tags];
    }
    return gradient;
  });
}

async function buildGrid(container, gradients) {
  const grid = createTag('div', { class: 'gradients-grid' });
  
  const taggedGradients = applyAutoTags(gradients);
  
  taggedGradients.forEach((gradient) => {
    const card = createGradientCard(gradient);
    grid.append(card);
  });
  
  container.append(grid);
}

async function buildFiltersAndSearch(container) {
  const toolbar = createTag('div', { class: 'gradients-toolbar' });
  
  const searchBar = createTag('input', { 
    type: 'search',
    class: 'gradient-search',
    placeholder: 'Search gradients...',
    'aria-label': 'Search gradients',
  });
  
  const filterBtn = createTag('button', { class: 'button secondary filter-btn' });
  filterBtn.textContent = 'Filter';
  
  const sortBtn = createTag('button', { class: 'button secondary sort-btn' });
  sortBtn.textContent = 'Sort';
  
  toolbar.append(searchBar, filterBtn, sortBtn);
  container.prepend(toolbar);
  
  searchBar.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterGradients(searchTerm);
  });
}

function filterGradients(searchTerm) {
  const cards = document.querySelectorAll('.gradient-card');
  cards.forEach((card) => {
    const name = card.querySelector('.gradient-name')?.textContent.toLowerCase() || '';
    const matches = name.includes(searchTerm);
    card.style.display = matches ? '' : 'none';
  });
}

export default async function decorate(block) {
  addTempWrapperDeprecated(block, 'explore-gradients');
  
  const utils = await import(`${getLibs()}/utils/utils.js`);
  ({ createTag } = utils);
  ({ getConfig } = utils);

  const loadingMsg = createTag('p', { class: 'loading-message' });
  loadingMsg.textContent = 'Loading gradients...';
  block.append(loadingMsg);

  try {
    const gradients = await fetchGradientData({ limit: 24 });
    
    if (gradients.length === 0) {
      loadingMsg.textContent = 'No gradients found.';
      return;
    }
    
    loadingMsg.remove();
    
    await buildFiltersAndSearch(block);
    await buildGrid(block, gradients);
    
  } catch (error) {
    loadingMsg.textContent = 'Failed to load gradients. Please try again later.';
    window.lana?.log(`Error in explore-gradients: ${error.message}`);
  }
}

