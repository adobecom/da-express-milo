import { createTag } from '../../scripts/utils.js';
import { createColorRenderer } from './factory/createColorRenderer.js';
import { createColorDataService } from './services/createColorDataService.js';
import { createColorModalManager } from './modal/createColorModalManager.js';
import BlockMediator from '../../scripts/block-mediator.min.js';
import { loadLit } from './components/s2/loadLit.js';

function parseConfig(block) {
  const config = {
    variant: 'strips', // default
    apiEndpoint: '/api/color/palettes',
    limit: 24,
    searchEnabled: true,
    modalType: 'drawer',
  };

  // Extract variant from class
  if (block.classList.contains('gradients')) {
    config.variant = 'gradients';
    config.apiEndpoint = '/api/color/gradients';
  } else if (block.classList.contains('extract')) {
    config.variant = 'extract';
    config.apiEndpoint = '/api/color/extract';
  }

  // Parse table rows for additional config
  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cols = Array.from(row.children);
    if (cols.length >= 2) {
      const key = cols[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
      const value = cols[1].textContent.trim();

      if (key && value) {
        // Map known config keys
        if (key === 'apiendpoint' || key === 'endpoint') {
          config.apiEndpoint = value;
        } else if (key === 'limit' || key === 'resultslimit') {
          config.limit = parseInt(value, 10);
        } else if (key === 'search' || key === 'searchenabled') {
          config.searchEnabled = value.toLowerCase() === 'true';
        } else if (key === 'modaltype' || key === 'modal') {
          config.modalType = value;
        } else {
          // Store as generic config
          config[key] = value;
        }
      }
    }
  });

  return config;
}

function getMockData(variant) {
  if (variant === 'strips') {
    return [
      {
        id: 'palette-1',
        name: 'Sunset Vibes',
        colors: ['#FF6B6B', '#FFA06B', '#FFD06B', '#FFE66B', '#FFF96B'],
      },
      {
        id: 'palette-2',
        name: 'Ocean Breeze',
        colors: ['#0A1172', '#1B2B8C', '#2C3FA6', '#3D52C0', '#4E65DA'],
      },
      {
        id: 'palette-3',
        name: 'Forest Green',
        colors: ['#0D3B0D', '#1E5C1E', '#2F7D2F', '#409E40', '#51BF51'],
      },
      {
        id: 'palette-4',
        name: 'Berry Mix',
        colors: ['#8B008B', '#A020A0', '#B540B5', '#CA60CA', '#DF80DF'],
      },
    ];
  }

  if (variant === 'gradients') {
    // Generate 34 total gradients (24 initial + 10 more for Load More)
    const gradientTemplates = [
      { name: 'Eternal Sunshine of the Spotless Mind', colors: ['#7B9EA6', '#D0ECF2', '#59391D', '#D99066', '#F34822'], positions: [0, 0.25, 0.4999, 0.75, 1], angle: 90 },
      { name: 'Sunset Vibes', colors: ['#FF6B6B', '#FF8E53', '#FFA06B', '#FFD06B', '#FFF96B'], angle: 90 },
      { name: 'Ocean Deep', colors: ['#0A1172', '#1B2B8C', '#2C3FA6', '#3D52C0', '#4E65DA'], angle: 135 },
      { name: 'Aurora Borealis', colors: ['#00FFA3', '#03E1FF', '#8B70FF', '#DC1FFF', '#FF6B9D'], angle: 45 },
      { name: 'Desert Heat', colors: ['#FFE259', '#FFC355', '#FFA751', '#FF8643', '#FF6B35'], angle: 90 },
      { name: 'Purple Dream', colors: ['#8B008B', '#9932CC', '#BA55D3', '#DA70D6', '#EE82EE'], angle: 180 },
      { name: 'Forest Mist', colors: ['#0D3B0D', '#1E5C1E', '#2F7D2F', '#409E40', '#51BF51'], angle: 90 },
      { name: 'Coral Reef', colors: ['#FF6F61', '#FF8577', '#FF9B8D', '#FFB1A3', '#FFC7B9'], angle: 45 },
      { name: 'Midnight Sky', colors: ['#001F3F', '#003D5C', '#005B7A', '#007998', '#0097B6'], angle: 135 },
      { name: 'Cherry Blossom', colors: ['#FFB7C5', '#FFC7D4', '#FFD7E3', '#FFE7F2', '#FFF7FF'], angle: 90 },
      { name: 'Tropical Paradise', colors: ['#00D9FF', '#00E6C3', '#00F387', '#7FFF4B', '#FFFF0F'], angle: 60 },
      { name: 'Autumn Leaves', colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'], angle: 120 },
      { name: 'Ice Cold', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'], angle: 90 },
      { name: 'Fire & Flame', colors: ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA07A'], angle: 45 },
      { name: 'Emerald Green', colors: ['#006400', '#228B22', '#32CD32', '#00FF00', '#7FFF00'], angle: 135 },
      { name: 'Royal Purple', colors: ['#4B0082', '#6A0DAD', '#7B1FA2', '#8E24AA', '#9C27B0'], angle: 90 },
      { name: 'Golden Hour', colors: ['#FFD700', '#FFDB58', '#FFDF70', '#FFE388', '#FFE7A0'], angle: 60 },
      { name: 'Deep Ocean', colors: ['#000080', '#00008B', '#0000CD', '#0000FF', '#1E90FF'], angle: 180 },
      { name: 'Peachy Keen', colors: ['#FFDAB9', '#FFDFC4', '#FFE4CF', '#FFE9DA', '#FFEEE5'], angle: 90 },
      { name: 'Neon Lights', colors: ['#FF00FF', '#FF1493', '#FF69B4', '#FF82AB', '#FFB6C1'], angle: 45 },
      { name: 'Misty Morning', colors: ['#F5F5F5', '#E8E8E8', '#DCDCDC', '#D3D3D3', '#C0C0C0'], angle: 135 },
      { name: 'Lavender Fields', colors: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3', '#9370DB'], angle: 90 },
      { name: 'Citrus Burst', colors: ['#FFA500', '#FFB733', '#FFC966', '#FFDB99', '#FFEDCC'], angle: 60 },
      { name: 'Stormy Weather', colors: ['#2F4F4F', '#3D5656', '#4B5D5D', '#596464', '#676B6B'], angle: 120 },
      { name: 'Rose Garden', colors: ['#FF0066', '#FF3385', '#FF66A3', '#FF99C2', '#FFCCE0'], angle: 90 },
      { name: 'Electric Blue', colors: ['#0000FF', '#0033FF', '#0066FF', '#0099FF', '#00CCFF'], angle: 45 },
      { name: 'Minty Fresh', colors: ['#98FF98', '#B2FFB2', '#CCFFCC', '#E6FFE6', '#F0FFF0'], angle: 135 },
      { name: 'Sunset Beach', colors: ['#FF6B35', '#F7931E', '#FDBB30', '#FFE66D', '#FFF4CC'], angle: 90 },
      { name: 'Deep Space', colors: ['#0C0C1E', '#1A1A3E', '#28285E', '#36367E', '#44449E'], angle: 180 },
      { name: 'Cotton Candy', colors: ['#FFB6D9', '#FFC7E3', '#FFD8ED', '#FFE9F7', '#FFF5FB'], angle: 60 },
      { name: 'Forest Green', colors: ['#0B3D0B', '#145214', '#1D671D', '#267C26', '#2F912F'], angle: 90 },
      { name: 'Cherry Red', colors: ['#8B0000', '#A52A2A', '#B22222', '#CD5C5C', '#DC143C'], angle: 45 },
      { name: 'Sky Blue', colors: ['#87CEEB', '#87CEFA', '#87CEEB', '#ADD8E6', '#B0E0E6'], angle: 135 },
      { name: 'Lime Green', colors: ['#32CD32', '#7FFF00', '#ADFF2F', '#BFFF00', '#DFFF00'], angle: 90 },
      { name: 'Plum Perfect', colors: ['#8E4585', '#9B5896', '#A86BA7', '#B57EB8', '#C291C9'], angle: 120 },
    ];

    return gradientTemplates.map((template, index) => {
      // Use custom positions if provided, otherwise distribute evenly
      const stops = template.positions
        ? template.colors.map((color, i) => ({
            color,
            position: template.positions[i],
          }))
        : template.colors.map((color, i) => ({
            color,
            position: i / (template.colors.length - 1),
          }));

      return {
        id: `gradient-${index + 1}`,
        name: template.name,
        type: 'linear',
        angle: template.angle,
        colorStops: stops,
        coreColors: template.colors,
      };
    });
  }

  return [];
}

export default async function decorate(block) {
  // Prevent double decoration
  if (block.dataset.blockStatus === 'loaded') {
    return;
  }

  // Mark as loading immediately
  block.dataset.blockStatus = 'loading';

  try {
    console.log('[Color Explorer] Decorate started');

    // Load Lit from Milo early (used by Spectrum tags in modals)
    // Block is used in 5+ pages, so load once at initialization
    loadLit().catch((error) => {
      console.warn('[Color Explorer] Failed to load Lit, modals may not work:', error);
      window.lana?.log('Color Explorer: Failed to load Lit from Milo', {
        tags: 'color-explorer,lit',
        error: error.message,
      });
    });

    // Clear authored content
    block.innerHTML = '';

    // 1. Parse configuration
    let config;
    try {
      config = parseConfig(block);
      console.log('[Color Explorer] Config parsed:', config.variant);
    } catch (error) {
      console.error('[Color Explorer] Config parse error:', error);
      throw new Error(`Failed to parse configuration: ${error.message}`);
    }

    // 2. Create services
    let dataService;
    let modalManager;
    try {
      dataService = createColorDataService(config);
      modalManager = createColorModalManager(config);
    } catch (error) {
      console.error('[Color Explorer] Service creation error:', error);
      throw new Error(`Failed to create services: ${error.message}`);
    }

    // 3. Fetch initial data (using mock for POC)
    let initialData = [];
    try {
      // TODO: Uncomment when API is ready
      // initialData = await dataService.fetch();

      // POC: Use mock data
      initialData = getMockData(config.variant);
      console.log(`[Color Explorer] Loaded ${initialData.length} items`);
    } catch (error) {
      console.error('[Color Explorer] Fetch error:', error);
      if (window.lana) {
        window.lana.log(`Color Explorer fetch error: ${error.message}`, {
          tags: 'color-explorer,init',
        });
      }
      // Use empty array as fallback
      initialData = [];
    }

    // 4. Initialize state management using BlockMediator
    const stateKey = `color-explorer-${config.variant}`;

    try {
      // Initialize state (always set initial state)
      BlockMediator.set(stateKey, {
        selectedItem: null,
        currentData: initialData,
        allData: initialData,
        searchQuery: '',
        totalCount: initialData.length,
      });
    } catch (error) {
      console.error('[Color Explorer] State initialization error:', error);
      // Continue without state management
    }

    // 5. Create container for renderer
    const container = createTag('div', { class: 'color-explorer-container' });
    block.appendChild(container);

    // 6. Create renderer using factory
    let renderer;
    try {
      renderer = createColorRenderer(config.variant, {
        container,
        data: initialData, // Pass all data, renderer handles pagination
        config,
        dataService,
        modalManager,
        stateKey,
      });
      console.log('[Color Explorer] Renderer created');
    } catch (error) {
      console.error('[Color Explorer] Renderer creation error:', error);
      throw new Error(`Failed to create renderer: ${error.message}`);
    }

    // 7. Render UI
    try {
      await renderer.render();
      console.log('[Color Explorer] Render completed');
    } catch (error) {
      console.error('[Color Explorer] Render error:', error);
      if (window.lana) {
        window.lana.log(`Color Explorer render error: ${error.message}`, {
          tags: 'color-explorer,render',
        });
      }
      // Show error but don't throw - allow page to continue
      const errorMsg = createTag('p', { class: 'error-message' }, 'Failed to load color explorer content.');
      container.appendChild(errorMsg);
      block.dataset.blockStatus = 'error';
      return; // Exit early on render error
    }

    // 8. Connect interactions (wrap in try-catch to prevent errors from halting)
    try {
      // Listen for item clicks and open modal
      if (renderer && typeof renderer.on === 'function') {
        renderer.on('item-click', (item) => {
          try {
            // Update state
            const currentState = BlockMediator.get(stateKey);
            BlockMediator.set(stateKey, { ...currentState, selectedItem: item });

            // Open modal
            if (modalManager) {
              modalManager.open(item, config.variant);
            }
          } catch (interactionError) {
            console.error('[Color Explorer] Interaction error:', interactionError);
          }
        });
      }

      // Subscribe to state changes for analytics/logging
      try {
        BlockMediator.subscribe(stateKey, ({ newValue }) => {
          if (window.lana) {
            window.lana.log(`Color Explorer state updated: ${config.variant}`, {
              tags: 'color-explorer,state',
              selectedItem: newValue?.selectedItem?.id,
              dataCount: newValue?.currentData?.length,
            });
          }
        });
      } catch (subscribeError) {
        console.warn('[Color Explorer] Subscription error (non-fatal):', subscribeError);
      }
    } catch (interactionError) {
      console.error('[Color Explorer] Interaction setup error (non-fatal):', interactionError);
      // Continue even if interactions fail
    }

    // Add wrapper class for styling
    block.classList.add(`color-explorer-${config.variant}`);

    // Mark as loaded
    block.dataset.blockStatus = 'loaded';
    console.log('[Color Explorer] Decorate completed successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Color Explorer] Decorate error:', error);
    if (window.lana) {
      window.lana.log(`Color Explorer init error: ${error.message}`, {
        tags: 'color-explorer,init',
      });
    }
    // Always set status to prevent infinite loading
    block.dataset.blockStatus = 'error';
    const errorMsg = createTag('p', { class: 'error-message' }, `Failed to load color explorer: ${error.message}`);
    block.innerHTML = '';
    block.append(errorMsg);
  }
}
