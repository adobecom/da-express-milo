# Color Tools Layered Architecture

## Executive Summary

This document proposes a **layered architecture** for the Color Tools project that cleanly separates the **UI Layer** from the **Data Layer**, connected through a **Pub/Sub Event Bus**. The goal is to create a modular, reusable, and maintainable codebase where:

1. **UI components are pure presentation** — they render state and emit user intents
2. **Data services are headless** — they manage state, perform calculations, and handle external APIs
3. **Communication is abstracted** — both layers interact through an event-based system without direct coupling

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Analysis: Current State](#2-analysis-current-state)
3. [Proposed Layer Breakdown](#3-proposed-layer-breakdown)
4. [Event Bus Design](#4-event-bus-design)
5. [UI Layer Architecture](#5-ui-layer-architecture)
6. [Data Layer Architecture](#6-data-layer-architecture)
7. [Communication Contracts](#7-communication-contracts)
8. [Implementation Strategy](#8-implementation-strategy)
9. [Reusability Considerations](#9-reusability-considerations)
10. [Decision Rationale](#10-decision-rationale)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   APPLICATION                                        │
│                           (color-tools block / page)                                 │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                                        │ bootstraps
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               EVENT BUS (Core)                                       │
│                                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                        ColorToolsEventBus                                    │   │
│   │                                                                              │   │
│   │  • publish(topic, payload)    → Emit event to all subscribers                │   │
│   │  • subscribe(topic, handler)  → Register handler for topic                   │   │
│   │  • unsubscribe(topic, handler)→ Remove handler                               │   │
│   │  • once(topic, handler)       → One-time subscription                        │   │
│   │                                                                              │   │
│   │  Topics: USER_INTENT | STATE_UPDATE | API_REQUEST | API_RESPONSE | ERROR     │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────────┐
│            UI LAYER                   │   │           DATA LAYER                  │
│       (Presentation & Input)          │   │      (State, Logic & Services)        │
│                                       │   │                                       │
│  ┌─────────────────────────────────┐  │   │  ┌─────────────────────────────────┐  │
│  │     Presentation Components     │  │   │  │       State Manager             │  │
│  │                                 │  │   │  │                                 │  │
│  │  • <color-wheel>               │  │   │  │  • Swatches & palette state     │  │
│  │  • <color-swatch-rail>         │  │   │  │  • Harmony rule                 │  │
│  │  • <color-palette>             │  │   │  │  • Base color index             │  │
│  │  • <color-harmony-toolbar>     │  │   │  │  • Theme metadata               │  │
│  │  • <image-drop-zone>           │  │   │  │  • Persistence (localStorage)   │  │
│  │  • <color-search>              │  │   │  │                                 │  │
│  └─────────────────────────────────┘  │   │  └─────────────────────────────────┘  │
│                                       │   │                                       │
│  ┌─────────────────────────────────┐  │   │  ┌─────────────────────────────────┐  │
│  │     Container Components        │  │   │  │       Calculation Engine        │  │
│  │                                 │  │   │  │                                 │  │
│  │  • <wheel-workspace>           │  │   │  │  • HarmonyEngine                │  │
│  │  • <palette-browser>           │  │   │  │  • Color conversions            │  │
│  │  • <image-extractor>           │  │   │  │  • Image color extraction       │  │
│  │  • <tab-container>             │  │   │  │  • Contrast calculations        │  │
│  └─────────────────────────────────┘  │   │  └─────────────────────────────────┘  │
│                                       │   │                                       │
│  ┌─────────────────────────────────┐  │   │  ┌─────────────────────────────────┐  │
│  │     Interaction Handlers        │  │   │  │       API Services              │  │
│  │                                 │  │   │  │                                 │  │
│  │  • Drag/drop behaviors         │  │   │  │  • EthosService (palettes)      │  │
│  │  • Canvas pointer events       │  │   │  │  • StockService (images)        │  │
│  │  • Keyboard navigation         │  │   │  │  • LibrariesService (save)      │  │
│  │  • Copy/paste actions          │  │   │  │  • AutotagService (tags)        │  │
│  └─────────────────────────────────┘  │   │  │  • SearchService               │  │
│                                       │   │  └─────────────────────────────────┘  │
│  Subscribes to: STATE_UPDATE          │   │                                       │
│  Publishes: USER_INTENT               │   │  ┌─────────────────────────────────┐  │
│                                       │   │  │       Analytics Adapter          │  │
└───────────────────────────────────────┘   │  │                                 │  │
                                            │  │  • Action tracking              │  │
                                            │  │  • Workflow instrumentation     │  │
                                            │  │  • Error reporting              │  │
                                            │  └─────────────────────────────────┘  │
                                            │                                       │
                                            │  Subscribes to: USER_INTENT, ERROR    │
                                            │  Publishes: STATE_UPDATE, API_RESPONSE│
                                            └───────────────────────────────────────┘
```

---

## 2. Analysis: Current State

### What Exists Today

After reviewing the codebase, the current implementation has:

| Aspect | Current Implementation | Location |
|--------|----------------------|----------|
| **State Management** | `ColorThemeController` — centralized controller with pub/sub pattern | `libs/color-components/controllers/` |
| **Harmony Calculations** | `HarmonyAdapter` wrapping `HarmonyEngine` | `libs/color-components/utils/harmony/` |
| **UI Components** | LitElement web components | `libs/color-components/components/` |
| **Color Utilities** | Conversion functions, color classes | `libs/color-components/utils/` |
| **Block Integration** | `color-tools.js` wires components with controller | `blocks/color-tools/` |

### Coupling Issues Identified

1. **Direct Controller Injection**: Components receive `controller` as a property and call its methods directly
   ```javascript
   // Current pattern — tight coupling
   colorWheel.controller = controller;
   controller.setBaseColor(hex);
   ```

2. **Mixed Responsibilities**: The controller handles state, harmony calculations, persistence, AND analytics

3. **No Clear API Boundary**: Backend service integration is not abstracted — would require modifying controller internals

4. **Component-State Entanglement**: Components subscribe directly to controller, making them hard to reuse without the specific controller implementation

---

## 3. Proposed Layer Breakdown

### Why Two Primary Layers?

The separation into **UI Layer** and **Data Layer** provides:

1. **Testability**: UI can be tested with mock event payloads; Data layer can be tested without DOM
2. **Reusability**: UI components can work with any data source that speaks the event protocol
3. **Replaceability**: Either layer can be swapped (e.g., React UI, different state management)
4. **Team Boundaries**: Frontend and backend/services teams can work independently

### Sub-Layer Breakdown

I propose breaking each primary layer into focused sub-layers:

#### UI Layer Sub-Layers

| Sub-Layer | Purpose | Rationale |
|-----------|---------|-----------|
| **Presentation Components** | Pure rendering based on props/state | Maximizes reusability; no business logic |
| **Container Components** | Orchestrate presentation components, manage local UI state | Separation of layout from behavior |
| **Interaction Handlers** | Encapsulate complex input handling (drag, canvas, keyboard) | Reusable across components |

#### Data Layer Sub-Layers

| Sub-Layer | Purpose | Rationale |
|-----------|---------|-----------|
| **State Manager** | Single source of truth for application state | Clear ownership, predictable updates |
| **Calculation Engine** | Pure functions for color math, harmony, extraction | Stateless, highly testable, portable |
| **API Services** | Abstractions over external endpoints | Isolates network concerns, enables mocking |
| **Analytics Adapter** | Unified tracking interface | Decouples analytics from business logic |

---

## 4. Event Bus Design

### Why Pub/Sub Over Direct Method Calls?

| Aspect | Direct Calls | Pub/Sub Events |
|--------|-------------|----------------|
| **Coupling** | Tight — caller must know callee's interface | Loose — only event contracts |
| **Extensibility** | Requires modifying callee | Add new subscribers without changes |
| **Debugging** | Harder to trace call chains | Centralized event log possible |
| **Testing** | Mock objects required | Emit/capture events |
| **Cross-Frame/Worker** | Not possible | Events can be serialized |

### Event Bus Contract

```javascript
// libs/color-components/core/EventBus.js

class ColorToolsEventBus {
  constructor() {
    this.subscribers = new Map();  // topic → Set<handler>
    this.history = [];             // optional: for debugging/replay
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - Event topic name
   * @param {function} handler - Callback receiving (payload, meta)
   * @returns {function} Unsubscribe function
   */
  subscribe(topic, handler) { /* ... */ }

  /**
   * Publish an event
   * @param {string} topic - Event topic name
   * @param {object} payload - Event data
   * @param {object} meta - Optional metadata (source, timestamp, correlationId)
   */
  publish(topic, payload, meta = {}) { /* ... */ }

  /**
   * One-time subscription
   */
  once(topic, handler) { /* ... */ }

  /**
   * Clear all subscriptions (useful for testing/cleanup)
   */
  reset() { /* ... */ }
}
```

### Event Topics

```javascript
// libs/color-components/core/EventTopics.js

export const Topics = {
  // UI → Data: User intents (what the user wants to do)
  USER_INTENT: {
    SET_BASE_COLOR: 'user.intent.setBaseColor',
    SET_HARMONY_RULE: 'user.intent.setHarmonyRule',
    SET_SWATCH: 'user.intent.setSwatch',
    RANDOMIZE: 'user.intent.randomize',
    ROTATE: 'user.intent.rotate',
    EXTRACT_FROM_IMAGE: 'user.intent.extractFromImage',
    SEARCH_PALETTES: 'user.intent.searchPalettes',
    SAVE_TO_LIBRARY: 'user.intent.saveToLibrary',
    COPY_HEX: 'user.intent.copyHex',
  },

  // Data → UI: State changes
  STATE_UPDATE: {
    PALETTE_CHANGED: 'state.paletteChanged',
    RULE_CHANGED: 'state.ruleChanged',
    LOADING_STATE: 'state.loading',
    ERROR: 'state.error',
  },

  // Data → UI: API responses
  API_RESPONSE: {
    PALETTES_LOADED: 'api.palettesLoaded',
    IMAGE_EXTRACTED: 'api.imageExtracted',
    SAVE_COMPLETE: 'api.saveComplete',
    SEARCH_RESULTS: 'api.searchResults',
  },

  // Lifecycle
  LIFECYCLE: {
    INITIALIZED: 'lifecycle.initialized',
    DESTROYED: 'lifecycle.destroyed',
  },
};
```

### Event Payload Structure

All events follow a consistent structure:

```javascript
{
  topic: 'user.intent.setBaseColor',
  payload: {
    hex: '#FF5500',
    source: 'wheel',        // optional: origin component
  },
  meta: {
    timestamp: 1736092800000,
    correlationId: 'uuid',  // optional: for tracing
    source: 'color-wheel',  // emitting component
  }
}
```

---

## 5. UI Layer Architecture

### 5.1 Presentation Components

Presentation components are **pure renderers**. They:
- Receive data via properties
- Emit semantic events for user actions
- Have no knowledge of the event bus or data layer

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION COMPONENTS                       │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │   color-wheel    │  │ color-swatch     │  │ color-search │   │
│  │                  │  │                  │  │              │   │
│  │ Props:           │  │ Props:           │  │ Props:       │   │
│  │ • baseColor      │  │ • hex            │  │ • value      │   │
│  │ • markers[]      │  │ • isBase         │  │ • suggestions│   │
│  │ • rule           │  │ • isLocked       │  │ • loading    │   │
│  │                  │  │                  │  │              │   │
│  │ Events:          │  │ Events:          │  │ Events:      │   │
│  │ • wheel-drag     │  │ • swatch-click   │  │ • search     │   │
│  │ • wheel-click    │  │ • swatch-lock    │  │ • clear      │   │
│  │ • marker-drag    │  │ • swatch-copy    │  │ • suggest    │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  harmony-rule    │  │   drop-zone      │  │ palette-card │   │
│  │  -selector       │  │                  │  │              │   │
│  │                  │  │ Props:           │  │ Props:       │   │
│  │ Props:           │  │ • accept         │  │ • colors[]   │   │
│  │ • selectedRule   │  │ • isDragging     │  │ • name       │   │
│  │ • availableRules │  │ • previewUrl     │  │ • isSelected │   │
│  │                  │  │                  │  │              │   │
│  │ Events:          │  │ Events:          │  │ Events:      │   │
│  │ • rule-select    │  │ • file-drop      │  │ • select     │   │
│  │                  │  │ • drag-enter     │  │              │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Container Components

Container components **connect** presentation components to the event bus. They:
- Subscribe to relevant state updates
- Translate user events into USER_INTENT events
- Manage local UI state (e.g., which panel is open)

```javascript
// Example: WheelWorkspaceContainer

class WheelWorkspaceContainer extends LitElement {
  static properties = {
    _palette: { state: true },
    _rule: { state: true },
    _baseColorIndex: { state: true },
  };

  connectedCallback() {
    super.connectedCallback();
    // Subscribe to state updates
    this._unsubPalette = this.eventBus.subscribe(
      Topics.STATE_UPDATE.PALETTE_CHANGED,
      (payload) => {
        this._palette = payload.swatches;
        this._rule = payload.rule;
        this._baseColorIndex = payload.baseColorIndex;
      }
    );
  }

  disconnectedCallback() {
    this._unsubPalette?.();
    super.disconnectedCallback();
  }

  _handleWheelDrag(e) {
    // Translate component event → user intent
    this.eventBus.publish(Topics.USER_INTENT.SET_BASE_COLOR, {
      hex: e.detail.hex,
      source: 'wheel',
    });
  }

  render() {
    return html`
      <color-wheel
        .baseColor=${this._palette?.[this._baseColorIndex]?.hex}
        .markers=${this._palette}
        @wheel-drag=${this._handleWheelDrag}
      ></color-wheel>
      <harmony-rule-selector
        .selectedRule=${this._rule}
        @rule-select=${this._handleRuleSelect}
      ></harmony-rule-selector>
    `;
  }
}
```

### 5.3 Interaction Handlers

Complex interaction logic is extracted into reusable handlers:

```javascript
// libs/color-components/ui/interactions/WheelDragHandler.js

export class WheelDragHandler {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.onDrag = options.onDrag;
    this.onDragEnd = options.onDragEnd;
  }

  attach() {
    this.canvas.addEventListener('pointerdown', this._handlePointerDown);
    // ... pointer move, up, cancel
  }

  detach() {
    // Remove listeners
  }

  _handlePointerDown = (e) => {
    // Calculate polar coordinates from canvas center
    // Determine which marker (if any) was hit
    // Begin drag tracking
  };
}
```

---

## 6. Data Layer Architecture

### 6.1 State Manager

The State Manager is the single source of truth. It:
- Holds palette state (swatches, rule, base index, metadata)
- Listens for USER_INTENT events
- Publishes STATE_UPDATE events after processing
- Persists state to localStorage

```
┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGER                              │
│                     (ColorStateManager)                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                        State Shape                          │ │
│  │                                                             │ │
│  │  {                                                          │ │
│  │    palette: {                                               │ │
│  │      swatches: [{ hex, hsv }],                              │ │
│  │      rule: 'ANALOGOUS',                                     │ │
│  │      baseColorIndex: 0,                                     │ │
│  │    },                                                       │ │
│  │    metadata: {                                              │ │
│  │      name: 'My Theme',                                      │ │
│  │      mood: 'colorful',                                      │ │
│  │      source: 'wheel' | 'image' | 'library',                 │ │
│  │    },                                                       │ │
│  │    ui: {                                                    │ │
│  │      loading: false,                                        │ │
│  │      error: null,                                           │ │
│  │    }                                                        │ │
│  │  }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Listens: USER_INTENT.*                                          │
│  Emits: STATE_UPDATE.PALETTE_CHANGED, STATE_UPDATE.LOADING       │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Calculation Engine

Pure functions with no side effects. These can be:
- Imported directly by State Manager
- Run in a Web Worker for heavy operations (image extraction)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALCULATION ENGINE                            │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │     HarmonyCalculator      │  │     ColorConverter         │ │
│  │                            │  │                            │ │
│  │  • applyRule(base, rule)   │  │  • hexToHSB(hex)           │ │
│  │  • getAvailableRules()     │  │  • hsbToHex(h, s, b)       │ │
│  │  • offsetColors(offsets)   │  │  • hexToRGB(hex)           │ │
│  └────────────────────────────┘  │  • rgbToCMYK(r, g, b)      │ │
│                                  │  • hexToLab(hex)           │ │
│  ┌────────────────────────────┐  └────────────────────────────┘ │
│  │    ImageColorExtractor     │                                 │
│  │                            │  ┌────────────────────────────┐ │
│  │  • extractPalette(imgData) │  │    ContrastCalculator      │ │
│  │  • clusterColors(pixels)   │  │                            │ │
│  │  • dominantColors(k)       │  │  • wcagRatio(fg, bg)       │ │
│  └────────────────────────────┘  │  • apca(fg, bg)            │ │
│                                  │  • suggestAccessible(hex)   │ │
│                                  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 API Services

Each external service gets a dedicated adapter:

```
┌─────────────────────────────────────────────────────────────────┐
│                       API SERVICES                               │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │      EthosService          │  │      StockService          │ │
│  │                            │  │                            │ │
│  │  • searchThemes(query)     │  │  • searchImages(query)     │ │
│  │  • getThemeById(id)        │  │  • getPaletteFromImage(id) │ │
│  │  • getCuratedThemes()      │  │                            │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │    LibrariesService        │  │     AutotagService         │ │
│  │                            │  │                            │ │
│  │  • listThemes()            │  │  • tagPalette(hexArray)    │ │
│  │  • saveTheme(palette)      │  │  • tagImage(imageUrl)      │ │
│  │  • updateTheme(id, data)   │  │  • suggestMoods(hexArray)  │ │
│  │  • deleteTheme(id)         │  │                            │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────┐                                  │
│  │   ServiceOrchestrator      │                                  │
│  │                            │                                  │
│  │  • Listens to USER_INTENT.SEARCH_PALETTES, etc.              │
│  │  • Calls appropriate service                                  │
│  │  • Publishes API_RESPONSE.*                                   │
│  └────────────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Analytics Adapter

A dedicated adapter that listens to relevant events and tracks them:

```javascript
// libs/color-components/data/analytics/AnalyticsAdapter.js

class AnalyticsAdapter {
  constructor(eventBus, config = {}) {
    this.eventBus = eventBus;
    this.channel = config.channel || 'color-tools';
  }

  attach() {
    // Track user intents
    Object.values(Topics.USER_INTENT).forEach((topic) => {
      this.eventBus.subscribe(topic, (payload, meta) => {
        this._track(topic, payload, meta);
      });
    });

    // Track errors
    this.eventBus.subscribe(Topics.STATE_UPDATE.ERROR, (payload) => {
      this._trackError(payload);
    });
  }

  _track(action, payload, meta) {
    const event = new CustomEvent('express:color-tools-action', {
      bubbles: true,
      detail: {
        action,
        channel: this.channel,
        workflow: 'color-tools',
        timestamp: meta.timestamp || Date.now(),
        ...payload,
      },
    });
    window.dispatchEvent(event);
  }
}
```

---

## 7. Communication Contracts

### 7.1 USER_INTENT Events (UI → Data)

| Event | Payload | Description |
|-------|---------|-------------|
| `user.intent.setBaseColor` | `{ hex: string, source?: string }` | User selected a new base color |
| `user.intent.setHarmonyRule` | `{ rule: string }` | User changed harmony rule |
| `user.intent.setSwatch` | `{ index: number, hex: string }` | User edited a specific swatch |
| `user.intent.randomize` | `{}` | User requested random palette |
| `user.intent.rotate` | `{ amount: number }` | User rotated palette order |
| `user.intent.extractFromImage` | `{ imageData: ImageData }` | User dropped/selected image |
| `user.intent.searchPalettes` | `{ query: string, filters?: object }` | User searched for palettes |
| `user.intent.selectPalette` | `{ id: string, source: string }` | User selected a preset palette |
| `user.intent.saveToLibrary` | `{ name?: string }` | User wants to save current palette |
| `user.intent.copyHex` | `{ hex: string, index: number }` | User copied a hex value |

### 7.2 STATE_UPDATE Events (Data → UI)

| Event | Payload | Description |
|-------|---------|-------------|
| `state.paletteChanged` | `{ swatches: [], rule: string, baseColorIndex: number }` | Palette state updated |
| `state.ruleChanged` | `{ rule: string, previousRule: string }` | Harmony rule changed |
| `state.loading` | `{ isLoading: boolean, operation?: string }` | Loading state change |
| `state.error` | `{ error: Error, recoverable: boolean }` | Error occurred |

### 7.3 API_RESPONSE Events (Data → UI)

| Event | Payload | Description |
|-------|---------|-------------|
| `api.palettesLoaded` | `{ items: [], cursor?: string, query?: string }` | Search/browse results |
| `api.imageExtracted` | `{ swatches: [], source: 'image' }` | Extraction complete |
| `api.saveComplete` | `{ id: string, name: string }` | Save to library succeeded |
| `api.searchResults` | `{ results: [], query: string }` | Search suggestions |

---

## 8. Implementation Strategy

### Phase 1: Core Infrastructure

1. **Create EventBus class** — `libs/color-components/core/EventBus.js`
2. **Define Event Topics** — `libs/color-components/core/EventTopics.js`
3. **Create event type definitions** — For TypeScript/IDE support

### Phase 2: Data Layer Extraction

1. **Extract StateManager** from `ColorThemeController`
   - Keep state shape
   - Replace direct method calls with event subscriptions
   - Emit events instead of calling subscribers

2. **Extract CalculationEngine** 
   - Move `HarmonyAdapter` usage into a pure service
   - Ensure all functions are stateless

3. **Create ServiceOrchestrator**
   - Placeholder for API services
   - Wires event subscriptions

### Phase 3: UI Layer Refactor

1. **Convert existing components to pure presentation**
   - Remove `controller` property
   - Accept data via props
   - Emit semantic DOM events

2. **Create Container components**
   - Subscribe to EventBus
   - Pass data to presentation components
   - Translate DOM events to EventBus events

### Phase 4: Integration

1. **Update `color-tools.js` block**
   - Instantiate EventBus
   - Bootstrap StateManager and UI containers
   - Wire AnalyticsAdapter

2. **Add API service stubs**
   - Ready for backend integration

---

## 9. Reusability Considerations

### UI Components in Other Contexts

With this architecture, UI components can be used:

| Context | Integration Pattern |
|---------|---------------------|
| **Same block, different page** | Reuse containers, same EventBus |
| **Different block** | Import presentation components, create new container |
| **Different framework (React)** | Create React wrapper that listens to EventBus |
| **Standalone widget** | Embed with minimal EventBus + StateManager |

### Data Layer in Other Contexts

| Context | Integration Pattern |
|---------|---------------------|
| **Web Worker** | Serialize events across worker boundary |
| **Server-side** | StateManager + CalculationEngine work in Node |
| **Testing** | Mock EventBus, emit events, assert state |

---

## 10. Decision Rationale

### Why Pub/Sub Over Direct Injection?

**Problem with current approach:**
```javascript
// Tight coupling — component knows controller interface
colorWheel.controller = controller;
this.controller.setBaseColor(hex);
```

**Benefits of events:**
```javascript
// Loose coupling — component only knows event topic
eventBus.publish('user.intent.setBaseColor', { hex });
```

1. **Components don't need to know who handles their intents**
2. **Multiple subscribers can react** (state manager + analytics + logging)
3. **Easy to mock for testing** — just emit/capture events
4. **Cross-boundary communication** — works with workers, iframes

### Why Separate Presentation from Container?

1. **Presentation components are maximally reusable** — they're just UI
2. **Container components encode wiring** — business-specific, less reusable
3. **Easier to test** — presentation with props, containers with events

### Why Sub-Layers in Data Layer?

1. **StateManager vs Services**: State is synchronous; services are async
2. **CalculationEngine**: Pure functions = no mocking needed = easiest to test
3. **Analytics Adapter**: Cross-cutting concern, shouldn't pollute business logic

### Why Not Redux/Zustand/etc.?

1. **Buildless environment** — Franklin requires ESM without build step
2. **Simplicity** — custom EventBus is ~50 lines, fully understood
3. **Control** — no external dependency to maintain
4. **Portability** — works anywhere JavaScript runs

---

## Next Steps

1. Review this architecture proposal
2. Identify any missing requirements or constraints
3. Create implementation tasks based on Phase 1-4
4. Begin with EventBus and core types

---

## Related Documents

- [Color Components Architecture](./color-components-architecture.md) — Current implementation details
- [Color Tools Gap Report](./color-tools-gap-report.md) — Features to implement
- [Color Tools Dev Handoff](./color-tools-dev-handoff.md) — Developer onboarding
- [Color Tools Backend Services](./color-tools-backend-services.md) — API contracts

