# Loading State Inspection - How Blocks Check API & Lit Status

## Overview

Blocks can check:
1. **If API has been called** (via data service)
2. **If Lit is loaded** (via custom elements registry)
3. **Current loading state** (via CSS classes)
4. **Instance availability** (via DOM references)

---

## 1. Checking if API Has Been Called

### Method A: Via Data Service Instance

```javascript
const block = document.querySelector('.color-explore');

if (block.dataServiceInstance) {
  const state = block.dataServiceInstance.getState?.();
  
  if (state && state.cache !== null) {
    console.log('✅ API has been called, data is cached');
  } else {
    console.log('❌ API not called yet or no data');
  }
}
```

### Method B: Via Loading State Manager

```javascript
import { globalLoadingState } from '../../scripts/color-shared/utils/createLoadingStateManager.js';

if (globalLoadingState.hasApiBeenCalled()) {
  console.log('✅ API has been called');
}

if (globalLoadingState.isDataLoaded()) {
  console.log('✅ Data is loaded and ready');
}
```

### Method C: Check Block Attributes

```javascript
const block = document.querySelector('.color-explore');

if (block.hasAttribute('data-loaded')) {
  console.log('✅ Block has finished loading');
}

if (block.hasAttribute('data-failed')) {
  console.log('❌ Block failed to load');
}
```

---

## 2. Checking if Lit is Loaded

### Method A: Via Custom Elements Registry

```javascript
if (window.customElements.get('color-palette')) {
  console.log('✅ Lit <color-palette> is loaded');
}

if (window.customElements.get('color-wheel')) {
  console.log('✅ Lit <color-wheel> is loaded');
}

if (window.customElements.get('color-search')) {
  console.log('✅ Lit <color-search> is loaded');
}
```

### Method B: Wait for Custom Element Definition

```javascript
await customElements.whenDefined('color-palette');
console.log('✅ <color-palette> is now defined');
```

### Method C: Via Loading State Manager

```javascript
import { globalLoadingState } from '../../scripts/color-shared/utils/createLoadingStateManager.js';

if (globalLoadingState.isLitLoaded()) {
  console.log('✅ Lit library is loaded');
}
```

### Method D: Listen for Lit Components Loading

```javascript
globalLoadingState.on('litLoaded', (loaded) => {
  if (loaded) {
    console.log('✅ Lit just finished loading');
  }
});
```

---

## 3. Checking Current Loading State

### Method A: Via CSS Classes (Built-in)

Every block automatically manages these CSS classes:

```javascript
const block = document.querySelector('.color-explore');

if (block.classList.contains('is-loading')) {
  console.log('⏳ Block is currently loading');
}

if (block.classList.contains('has-error')) {
  console.log('❌ Block encountered an error');
}
```

**CSS Classes Used:**
- `.is-loading` - Block is fetching data or processing
- `.has-error` - Block failed to load

**Example in CSS:**
```css
.color-explore.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.color-explore.is-loading::after {
  content: '';
  /* spinner styles */
  animation: spin 0.8s linear infinite;
}
```

### Method B: Via Loading State Manager

```javascript
import { globalLoadingState } from '../../scripts/color-shared/utils/createLoadingStateManager.js';

if (globalLoadingState.isLoading()) {
  console.log('⏳ Something is loading');
}

globalLoadingState.on('loading', (isLoading) => {
  if (isLoading) {
    console.log('⏳ Loading started');
  } else {
    console.log('✅ Loading finished');
  }
});
```

---

## 4. Checking Block Instances

### Blocks Expose Their Instances

All blocks expose their instances on the DOM element:

```javascript
const block = document.querySelector('.color-explore');

if (block.rendererInstance) {
  console.log('✅ Renderer is available');
  const data = block.rendererInstance.getData();
  console.log('Current data:', data);
}

if (block.dataServiceInstance) {
  console.log('✅ Data service is available');
  const cache = block.dataServiceInstance.getCache?.();
}

if (block.modalManagerInstance) {
  console.log('✅ Modal manager is available');
  block.modalManagerInstance.openPaletteModal(palette);
}
```

---

## 5. Complete Loading Status Check

### Utility Function

```javascript
function getBlockStatus(blockSelector) {
  const block = document.querySelector(blockSelector);
  
  if (!block) {
    return { error: 'Block not found' };
  }

  return {
    // Block state
    exists: true,
    isLoading: block.classList.contains('is-loading'),
    hasError: block.classList.contains('has-error'),
    isFailed: block.hasAttribute('data-failed'),
    
    // Instances
    hasRenderer: !!block.rendererInstance,
    hasDataService: !!block.dataServiceInstance,
    hasModalManager: !!block.modalManagerInstance,
    
    // Data state
    dataLoaded: block.dataServiceInstance?.getState ? 
      block.dataServiceInstance.getState().cache !== null : false,
    
    // Lit state
    litLoaded: {
      palette: !!window.customElements.get('color-palette'),
      wheel: !!window.customElements.get('color-wheel'),
      search: !!window.customElements.get('color-search'),
      swatch: !!window.customElements.get('ac-color-swatch'),
    },
  };
}

const status = getBlockStatus('.color-explore');
console.log(status);
```

**Output Example:**
```javascript
{
  exists: true,
  isLoading: false,
  hasError: false,
  isFailed: false,
  hasRenderer: true,
  hasDataService: true,
  hasModalManager: true,
  dataLoaded: true,
  litLoaded: {
    palette: true,
    wheel: false,
    search: false,
    swatch: false
  }
}
```

---

## 6. Real-World Usage Examples

### Example 1: Wait for Block to Load Before Interacting

```javascript
async function waitForBlockReady(selector) {
  const block = document.querySelector(selector);
  
  if (!block) {
    throw new Error(`Block ${selector} not found`);
  }

  while (block.classList.contains('is-loading')) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (block.hasAttribute('data-failed')) {
    throw new Error('Block failed to load');
  }

  return block;
}

const block = await waitForBlockReady('.color-explore');
console.log('✅ Block is ready:', block.rendererInstance);
```

---

### Example 2: Check if Specific Lit Component is Available

```javascript
async function ensureLitComponent(componentName) {
  if (window.customElements.get(componentName)) {
    return true;
  }

  try {
    await customElements.whenDefined(componentName);
    return true;
  } catch (error) {
    console.error(`Component ${componentName} failed to load`);
    return false;
  }
}

if (await ensureLitComponent('color-palette')) {
  const palette = document.createElement('color-palette');
  palette.palette = { colors: ['#FF0000', '#00FF00', '#0000FF'] };
  document.body.appendChild(palette);
}
```

---

### Example 3: Monitor Loading States

```javascript
import { globalLoadingState } from '../../scripts/color-shared/utils/createLoadingStateManager.js';

globalLoadingState.on('apiCalled', () => {
  console.log('📡 API was just called');
});

globalLoadingState.on('dataLoaded', (loaded) => {
  console.log(loaded ? '✅ Data loaded' : '⏳ Data not loaded');
});

globalLoadingState.on('litLoaded', () => {
  console.log('✅ Lit library loaded');
});

globalLoadingState.on('loading', (isLoading) => {
  const spinner = document.querySelector('.global-spinner');
  spinner.style.display = isLoading ? 'block' : 'none';
});
```

---

### Example 4: Conditional Logic Based on Loading State

```javascript
const block = document.querySelector('.color-explore');

if (block.classList.contains('is-loading')) {
  console.log('⏳ Block is loading, showing spinner...');
  
} else if (block.hasAttribute('data-failed')) {
  console.log('❌ Block failed, showing error message...');
  
} else if (block.rendererInstance) {
  console.log('✅ Block loaded successfully');
  
  const data = block.rendererInstance.getData();
  console.log(`Showing ${data.length} items`);
  
  const hasApi = block.dataServiceInstance?.getState?.().cache !== null;
  console.log(hasApi ? '✅ Using live data' : '⚠️ Using mock data');
  
  const hasLit = !!window.customElements.get('color-palette');
  console.log(hasLit ? '✅ Using Lit components' : '⚠️ Using vanilla JS');
}
```

---

### Example 5: Debug Helper

```javascript
window.debugColorBlocks = function() {
  const blocks = document.querySelectorAll('[class*="color-"]');
  
  blocks.forEach(block => {
    const blockName = block.className.split(' ')[0];
    
    console.group(`🎨 ${blockName}`);
    console.log('Loading:', block.classList.contains('is-loading'));
    console.log('Error:', block.classList.contains('has-error'));
    console.log('Renderer:', !!block.rendererInstance);
    console.log('Data Service:', !!block.dataServiceInstance);
    console.log('Modal Manager:', !!block.modalManagerInstance);
    
    if (block.dataServiceInstance) {
      const cache = block.dataServiceInstance.getState?.()?.cache;
      console.log('Data cached:', cache !== null);
      console.log('Cache size:', cache?.length || 0);
    }
    
    console.groupEnd();
  });
  
  console.group('🎭 Lit Components');
  console.log('color-palette:', !!window.customElements.get('color-palette'));
  console.log('color-wheel:', !!window.customElements.get('color-wheel'));
  console.log('color-search:', !!window.customElements.get('color-search'));
  console.log('ac-color-swatch:', !!window.customElements.get('ac-color-swatch'));
  console.groupEnd();
};

window.debugColorBlocks();
```

---

## 7. Loading State Timeline

### Typical Block Lifecycle

```
1. Block HTML appears in DOM
   └─ State: exists=true, isLoading=false

2. Franklin calls decorate()
   └─ State: isLoading=false (not started yet)

3. Block adds .is-loading class
   └─ State: isLoading=true

4. Data service created
   └─ State: hasDataService=true

5. API called (if needed)
   └─ State: apiCalled=true

6. Data received and cached
   └─ State: dataLoaded=true

7. Renderer created
   └─ State: hasRenderer=true

8. First Lit component needed
   └─ Dynamic import starts

9. Lit component loads
   └─ State: litLoaded.palette=true

10. Block removes .is-loading class
    └─ State: isLoading=false

11. Block ready for interaction
    └─ State: All instances available
```

---

## 8. Per-Page Loading Patterns

### Explore Page

```javascript
// Check if Explore page is ready
const explore = document.querySelector('.color-explore');
const search = document.querySelector('.search-marquee');

console.log('Search marquee:', search ? '✅' : '❌');
console.log('Color explore:', explore ? '✅' : '❌');

if (explore?.dataServiceInstance) {
  console.log('✅ Explore has data service');
  console.log('API called:', explore.dataServiceInstance.getState?.().cache !== null);
}

if (window.customElements.get('color-palette')) {
  console.log('✅ Palette Lit component loaded');
}
```

### Extract Page

```javascript
// Extract doesn't call API on load
const extract = document.querySelector('.color-extract');

console.log('Extract block:', extract ? '✅' : '❌');
console.log('Data service:', extract?.dataServiceInstance ? '✅' : '❌');
console.log('Should be false (no data on load)');
```

### Color Wheel Page

```javascript
// Pure client-side, no API
const wheel = document.querySelector('.color-wheel');

console.log('Wheel block:', wheel ? '✅' : '❌');
console.log('Data service:', wheel?.dataServiceInstance ? '✅' : '❌');
console.log('Should be undefined (pure client-side)');

if (window.customElements.get('color-wheel')) {
  console.log('✅ Color wheel Lit component loaded');
}
```

---

## 9. Testing & Debugging

### Quick Status Check (Console)

```javascript
// Quick status of all color blocks
document.querySelectorAll('[class*="color-"]').forEach(block => {
  console.log(
    block.className,
    'Loading:', block.classList.contains('is-loading'),
    'Error:', block.classList.contains('has-error'),
    'Has Data:', !!block.dataServiceInstance,
    'Has Renderer:', !!block.rendererInstance
  );
});
```

### Monitor Lit Components

```javascript
setInterval(() => {
  const lit = {
    palette: !!window.customElements.get('color-palette'),
    wheel: !!window.customElements.get('color-wheel'),
    search: !!window.customElements.get('color-search'),
  };
  console.log('Lit status:', lit);
}, 1000);
```

---

## Summary

### Three Ways to Check Loading State:

1. **CSS Classes** (Built-in, always available)
   ```javascript
   block.classList.contains('is-loading')
   ```

2. **Block Instances** (Available after block loads)
   ```javascript
   block.dataServiceInstance
   block.rendererInstance
   ```

3. **Custom Elements Registry** (For Lit components)
   ```javascript
   window.customElements.get('color-palette')
   ```

### Best Practices:

- ✅ Use CSS classes for UI state (loading spinners, disabled states)
- ✅ Use instances for programmatic access (get data, call methods)
- ✅ Use custom elements registry for Lit component detection
- ✅ Use loading state manager for global coordination
- ✅ Always check if instances exist before accessing them

### Common Checks:

```javascript
const isBlockLoading = block.classList.contains('is-loading');
const hasData = block.dataServiceInstance?.getState?.().cache !== null;
const isLitLoaded = !!window.customElements.get('color-palette');
const hasError = block.classList.contains('has-error');
```
