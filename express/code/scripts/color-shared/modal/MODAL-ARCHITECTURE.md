# 🪟 Modal Architecture

## Overview

The modal system consists of:
1. **Modal Manager** - Orchestrates modal lifecycle
2. **Modal Content** - Variant-specific content (palette, gradient, etc.)
3. **Lit Components** - Color editing components

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│            Modal Manager (Singleton)                │
│  - Open/close state                                 │
│  - Overlay & container creation                     │
│  - Keyboard handling (ESC, Tab trap)                │
│  - Backdrop click handling                          │
│  - Only one modal at a time                         │
└─────────────────────────────────────────────────────┘
                        │
                        │ Provides structure
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Palette    │ │   Gradient   │ │   Extract    │
│    Modal     │ │    Modal     │ │    Modal     │
│   Content    │ │   Content    │ │   Content    │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        │ Uses Lit      │ Uses Lit      │ Uses Lit
        │               │               │
        ▼               ▼               ▼
┌─────────────────────────────────────────────────────┐
│              Lit Components (via Adapters)          │
│  - <color-wheel>                                    │
│  - <color-palette>                                  │
│  - <ac-color-swatch>                                │
│  - <ac-brand-libraries-color-picker>                │
└─────────────────────────────────────────────────────┘
```

---

## 🏗️ File Structure

```
modal/
├── createModalManager.js        [MANAGER - Orchestrates everything]
├── createPaletteModal.js        [CONTENT - Palette editing]
├── createGradientModal.js       [CONTENT - Gradient editing]
├── createColorWheelModal.js     [CONTENT - Color wheel (generic)]
└── MODAL-ARCHITECTURE.md        [THIS FILE - Documentation]
```

---

## 🔄 Modal Flow

### **Opening a Modal:**

```
Renderer (e.g., Gradients)
    │
    ├─→ User clicks "Edit" button
    │
    ▼
Create Modal Content
    │
    ├─→ createGradientModal(gradient, options)
    │   └─→ Returns { element, getGradient, destroy }
    │
    ▼
Open Modal via Manager
    │
    ├─→ modalManager.open({
    │       type: 'full-screen',
    │       title: 'Edit Gradient',
    │       content: gradientModal.element,
    │       actions: {
    │         onConfirm: () => save(gradientModal.getGradient())
    │       }
    │   })
    │
    ▼
Modal Manager
    │
    ├─→ Creates overlay
    ├─→ Creates container
    ├─→ Adds header, body, footer
    ├─→ Appends content to body
    ├─→ Adds to DOM
    ├─→ Prevents body scroll
    ├─→ Adds keyboard listeners
    └─→ Focuses first element
```

### **Closing a Modal:**

```
User Action (ESC, backdrop click, cancel button)
    │
    ▼
Modal Manager
    │
    ├─→ Removes open class (animation)
    ├─→ Waits for animation
    ├─→ Removes from DOM
    ├─→ Restores body scroll
    ├─→ Removes keyboard listeners
    ├─→ Calls onClose callback
    │
    ▼
Content Cleanup
    │
    └─→ content.destroy()
        └─→ Lit adapters destroyed
```

---

## 💡 Usage Examples

### **Example 1: Palette Modal (Strips Variant)**

```javascript
// In renderers/createStripsRenderer.js

import { createModalManager } from '../modal/createModalManager.js';
import { createPaletteModal } from '../modal/createPaletteModal.js';

function createStripsRenderer(options) {
  const modalManager = createModalManager();
  
  function handlePaletteClick(palette) {
    // Create palette modal content
    const paletteModal = createPaletteModal(palette, {
      onColorEdit: (color, index) => {
        // Open nested color wheel modal
        openColorWheelModal(color, (newColor) => {
          paletteModal.updateColor(index, newColor);
        });
      },
    });
    
    // Open modal
    modalManager.open({
      type: 'drawer',
      title: `Edit ${palette.name}`,
      content: paletteModal.element,
      actions: {
        cancelLabel: 'Cancel',
        confirmLabel: 'Save Palette',
        onConfirm: () => {
          const updatedPalette = paletteModal.getPalette();
          savePalette(updatedPalette);
          modalManager.close();
        },
      },
      onClose: () => {
        paletteModal.destroy();
      },
    });
  }
  
  return { handlePaletteClick };
}
```

### **Example 2: Gradient Modal (Gradients Variant)**

```javascript
// In renderers/createGradientsRenderer.js

import { createModalManager } from '../modal/createModalManager.js';
import { createGradientModal } from '../modal/createGradientModal.js';

function createGradientsRenderer(options) {
  const modalManager = createModalManager();
  
  function handleGradientClick(gradient) {
    // Create gradient modal content
    const gradientModal = createGradientModal(gradient, {
      onColorEdit: (color, stopIndex) => {
        // Open nested color wheel modal
        openColorWheelModal(color, (newColor) => {
          gradientModal.updateColorStop(stopIndex, newColor);
        });
      },
    });
    
    // Open modal
    modalManager.open({
      type: 'full-screen',
      title: `Edit ${gradient.name}`,
      content: gradientModal.element,
      actions: {
        cancelLabel: 'Cancel',
        confirmLabel: 'Save Gradient',
        onConfirm: () => {
          const updatedGradient = gradientModal.getGradient();
          saveGradient(updatedGradient);
          modalManager.close();
        },
      },
      onClose: () => {
        gradientModal.destroy();
      },
    });
  }
  
  return { handleGradientClick };
}
```

### **Example 3: Color Wheel Modal (Generic)**

```javascript
// Nested modal for editing individual colors

import { createModalManager } from '../modal/createModalManager.js';
import { createColorWheelAdapter } from '../adapters/litComponentAdapters.js';

function openColorWheelModal(initialColor, onSave) {
  const modalManager = createModalManager();
  
  // Create color wheel via adapter
  const wheelAdapter = createColorWheelAdapter(initialColor, {
    onChange: (color) => {
      console.log('Color changing:', color);
    },
  });
  
  // Open modal
  modalManager.open({
    type: 'full-screen',
    title: 'Choose Color',
    content: wheelAdapter.element,
    actions: {
      confirmLabel: 'Select Color',
      onConfirm: () => {
        const selectedColor = wheelAdapter.getCurrentColor();
        onSave(selectedColor);
        modalManager.close();
      },
    },
    onClose: () => {
      wheelAdapter.destroy();
    },
  });
}
```

---

## 🎯 Key Design Decisions

### **1. Manager Pattern (Not Singleton Service)**
- Each renderer can create its own manager
- Or share a global instance
- Prevents conflicts with multiple modals

### **2. Content Separation**
- Manager handles structure & lifecycle
- Content handles variant-specific UI
- Clean separation of concerns

### **3. Nested Modals**
- Main modal (palette/gradient editor)
- Can open nested modal (color wheel)
- Previous modal stays in DOM, new one overlays

### **4. Keyboard Handling**
- ESC always closes current modal
- Tab trap keeps focus inside modal
- Accessible by default

### **5. Animations**
- CSS transitions for open/close
- Manager waits for animation before removal
- Smooth user experience

---

## 📋 Modal Types

| Type | Use Case | Size | Position |
|------|----------|------|----------|
| **drawer** | Quick edits | ~40% width | Right side |
| **full-screen** | Complex editing | 100% | Center overlay |

---

## ✅ Benefits

1. **Reusable Manager**
   - One manager, many content types
   - Consistent modal behavior
   - Easy to maintain

2. **Flexible Content**
   - Each variant has custom content
   - Content doesn't know about structure
   - Easy to test

3. **Lit Integration**
   - Content uses Lit components via adapters
   - Manager is framework-agnostic
   - Best of both worlds

4. **Accessible**
   - Keyboard navigation built-in
   - ARIA attributes
   - Focus management

5. **Composable**
   - Modals can nest
   - Content can be swapped
   - Easy to extend

---

## 🚀 Next Steps

1. Implement CSS for modal styles
2. Add animations
3. Test keyboard navigation
4. Implement Adobe Libraries integration
5. Add mobile-specific behavior
