# Explore Palettes Feature - Jira Ticket Breakdown

## Implementation Plan Diagrams

### 1. Component Architecture Flow
[![Component Architecture](https://www.figma.com/online-whiteboard/create-diagram/bafaf0c2-26c9-49b0-8465-1c5d5bbf916c)](https://www.figma.com/online-whiteboard/create-diagram/bafaf0c2-26c9-49b0-8465-1c5d5bbf916c)

**Shows the technical architecture:**
- Block Layer → Web Components → Vanilla JS → API Layer
- How components interact and communicate
- Reusable components (Color Strip, Action Button)

### 2. Implementation Plan Flow
[![Implementation Plan](https://www.figma.com/online-whiteboard/create-diagram/aaf9abd4-5ee7-447a-9562-f34fdb5cd115)](https://www.figma.com/online-whiteboard/create-diagram/aaf9abd4-5ee7-447a-9562-f34fdb5cd115)

**Shows the feature flow:**
- Variant detection and routing
- Grid variant components and dependencies
- Modal variant components and dependencies
- Ticket relationships and dependencies

### 3. Implementation Timeline
[![Implementation Timeline](https://www.figma.com/online-whiteboard/create-diagram/44c07963-1727-4eea-979d-f39cedd7a063)](https://www.figma.com/online-whiteboard/create-diagram/44c07963-1727-4eea-979d-f39cedd7a063)

**Shows the Gantt chart timeline:**
- Phase 1: Core Features (Tickets 1-8)
- Phase 2: Modal Features (Tickets 9-13)
- Phase 3: Polish & Testing
- Critical path and dependencies

### Summary of Key Components

#### Block Layer
- **Block Name**: `palette` (or `explore-palettes`)
- **Variant Detection**: Routes to appropriate Web Component
- **Variants**: `(grid)`, `(modal)`, `(horizontal)`, `(vertical)`, `(card)`

#### Web Components (Lit Elements)
- `palette-grid-container` - Grid variant with filters and search
- `palette-modal-container` - Modal variant with save functionality
- `color-strip` - Reusable color display component (shared with Extract Palette)
- `color-action-button` - Reusable action button system (shared with Extract Palette)

#### Vanilla JS (Enhanced)
- `search-marquee` - Enhanced to dispatch CustomEvents
- `picker` widget - Used for filter dropdowns

#### API Integration
- Color API - Search and filter palettes
- CC Libraries API - Save palettes to libraries

### Ticket Dependencies

```
Phase 1: Core Features
├── Ticket 1: Grid Variant (foundation)
│   ├── Creates Color Strip component
│   └── Creates Grid Container
├── Ticket 2: Filter Dropdowns
│   └── Depends on: Ticket 1
├── Ticket 3: API Integration
│   ├── Depends on: Ticket 1, Ticket 2
│   └── Connects filters to API
├── Ticket 4: Search Bar Integration
│   ├── Depends on: Ticket 1, Ticket 3
│   └── Enhances search-marquee block
├── Ticket 5: Search Bar Enhancement
│   └── Depends on: Ticket 4 (optional)
├── Ticket 6: Palette Card Actions
│   ├── Depends on: Ticket 1
│   └── Creates Action Button system
├── Ticket 7: Responsive Design
│   └── Depends on: All Phase 1 tickets
└── Ticket 8: Analytics
    └── Depends on: All Phase 1 tickets

Phase 2: Modal Features
├── Ticket 9: Modal Basic Structure
│   └── Depends on: Ticket 1 (reuses Color Strip)
├── Ticket 10: Modal Color Display
│   ├── Depends on: Ticket 9
│   └── Uses Color Strip component
├── Ticket 11: Save to CC Libraries
│   ├── Depends on: Ticket 9
│   └── Integrates CC Libraries API
├── Ticket 12: Toast Notifications
│   └── Depends on: Ticket 11
└── Ticket 13: Action Buttons Integration
    ├── Depends on: Ticket 6, Ticket 9
    └── Uses Action Button system

Phase 3: Polish
├── Ticket 7: Responsive Design (continued)
└── Ticket 8: Analytics (continued)
```

---

## Overview
This document breaks down the work needed to implement the **Palette Block** - a single, flexible block component with multiple authoring variants. Authors can choose different variants to display palettes in various ways (grid, modal, horizontal, vertical, etc.). The feature consists of three main sections: Search Bar, Filters, and Display Section.

## Estimation Notes
- **Story Points to Hours Conversion**: 1 SP ≈ 4 hours
- **Hours are estimates** and may vary based on:
  - Developer experience with codebase
  - API availability and documentation
  - Design clarifications needed
  - Unexpected technical challenges
- **Total Estimated Time**: 
  - **Core Features (Tickets 1-8)**: 72-88 hours (9-11 days)
  - **Modal Features (Tickets 9-13)**: 64-80 hours (8-10 days)
  - **Grand Total**: 136-164 hours (17-20.5 days)
- **Existing Work Accounted For**:
  - Basic block structure (`explore-palettes.js` and `.css`) already exists in `color-poc` branch
  - Can reuse existing `color-palette` and `color-palette-list` Web Components
  - Filter dropdown structure already implemented
  - Responsive CSS already exists
  - Search bar block (`search-marquee`) already exists - just needs enhancement
  - Main work is converting Display/Filters to Web Component pattern and adding API integration
- **Architecture Split**:
  - **Display & Filters**: New Web Components (Lit Elements)
  - **Search Bar**: Enhancement to existing vanilla JS block

## Architecture Summary

### Single Block, Multiple Variants
**Block Name**: `palette` (or `explore-palettes`)  
**Pattern**: Similar to `color-tools` block with variants

**Authoring Variants** (authors choose via block name):
- `Palette (grid)` - Grid display with filters and search (default/explore view)
- `Palette (modal)` - Modal/detailed view
- `Palette (horizontal)` - Horizontal color orientation
- `Palette (vertical)` - Vertical color orientation
- `Palette (card)` - Card-based display

### Component Structure
- **Search Bar Section**: Similar block exists (`search-marquee`), may need adaptation
- **Filters Section**: Three dropdown filters (Type, Sort, Time Period) - shown in grid variant
- **Display Section**: Grid of palette cards that loads via API on page load
- **Modal Section**: Detailed palette view with all features
- **Integration**: Search and filters need to update the displayed palettes via API calls

## Web Component Architecture (color-poc branch)
- **Single Block**: `express/code/blocks/palette/` (or `explore-palettes/`)
  - **Block Decorator**: Detects variant and instantiates appropriate Web Component
  - **Variants**: Determined by block class name (e.g., `palette.grid`, `palette.modal`)
- **Web Components** (Lit Elements):
  - `palette-grid-container` - Grid display variant with filters
  - `palette-modal-container` - Modal/detailed view variant
  - Reuse existing: `color-palette`, `color-palette-list`, `progress-circle`
- **Search Bar**: Enhancement to existing vanilla JS block (`search-marquee`) - ENHANCEMENT
  - Existing block: `express/code/blocks/search-marquee/search-marquee.js`
  - Will remain vanilla JS, just needs integration with Web Component

## Palette Block Variants

### Single Block Architecture
**One Block**: `palette` (or `explore-palettes`)  
**Multiple Variants**: Authors choose variant via block name (similar to `color-tools` block)

### Authoring Pattern
```
Palette (grid)
Palette (modal)
Palette (horizontal)
Palette (vertical)
Palette (card)
```

### Variant Details

#### 1. **Grid Variant** (`palette.grid` or `Palette (grid)`)
- **Purpose**: Main explore/discover view
- **Features**: 
  - Grid of palette cards
  - Filters (Type, Sort, Time Period)
  - Search integration
  - API-driven palette loading
- **Use Case**: Main landing page, explore section

#### 2. **Modal Variant** (`palette.modal` or `Palette (modal)`)
- **Purpose**: Detailed palette view
- **Features**:
  - Full palette details
  - Color strips with hex codes
  - Save to CC Libraries
  - Action buttons (Edit, Share, Download, Save)
  - Creator info and tags
- **Use Case**: Detailed view when clicking a palette card

#### 3. **Horizontal Variant** (`palette.horizontal` or `Palette (horizontal)`)
- **Purpose**: Horizontal color orientation
- **Features**:
  - Colors displayed left-to-right
  - Best for wide containers, fewer colors (3-5)
- **Use Case**: Hero sections, featured palettes

#### 4. **Vertical Variant** (`palette.vertical` or `Palette (vertical)`)
- **Purpose**: Vertical color orientation
- **Features**:
  - Colors displayed top-to-bottom
  - Best for narrow containers, many colors (5-10+)
- **Use Case**: Sidebars, mobile views

#### 5. **Card Variant** (`palette.card` or `Palette (card)`)
- **Purpose**: Individual palette card display
- **Features**:
  - Single palette card
  - Compact display
- **Use Case**: Embedded palettes, featured items

### Variant Implementation
- **Block Decorator**: Detects variant from block class name
  ```javascript
  const variant = block.classList.contains('grid') ? 'grid' :
                  block.classList.contains('modal') ? 'modal' :
                  block.classList.contains('horizontal') ? 'horizontal' :
                  block.classList.contains('vertical') ? 'vertical' :
                  block.classList.contains('card') ? 'card' : 'grid'; // default
  ```
- **Web Component Selection**: Instantiates appropriate component based on variant
  - Grid → `<palette-grid-container></palette-grid-container>`
  - Modal → `<palette-modal-container></palette-modal-container>`
  - Horizontal/Vertical → `<palette-display-container orientation="${variant}"></palette-display-container>`
- **Shared Components**: All variants can reuse `color-palette` component internally

### Responsive Behavior
- Variants can have responsive adjustments
- Orientation variants can auto-adjust based on container width
- Breakpoints:
  - < 400px width → May switch to vertical
  - 400-800px width → Based on variant
  - > 800px width → Based on variant
- **Variant Override**: Authoring variant takes precedence, but responsive adjustments can still apply

---

## Ticket 1: Palette Block - Grid Variant (Main Display)
**Priority**: High  
**Story Points**: 5 | **Estimated Hours**: 20-24 hours (2.5-3 days)  
**Component**: `express/code/blocks/palette` + Web Component

### Description
Create the Palette Block with Grid variant - the main explore/discover view that shows palettes from an API call on page load using Web Components (Lit Elements). Includes creating the reusable Color Strip component.

### Acceptance Criteria
- [ ] Create Palette Block: `express/code/blocks/palette/palette.js`
- [ ] **Variant Detection**: Block decorator detects variant from class name (e.g., `palette.grid`)
- [ ] **Grid Variant**: Create Web Component `palette-grid-container` using Lit Element pattern
- [ ] **Color Strip Component**: Create reusable `color-strip` Web Component
  - Supports horizontal/vertical orientation
  - Supports size variants (L/M/S)
  - Supports 3, 5, 6+ color counts with equal distribution
  - Hex code display (on hover for grid cards)
  - Copy hex code functionality
  - Hover states and interactions
- [ ] Block component instantiates appropriate Web Component based on variant
- [ ] Fetches palettes from API endpoint on initial load (similar to `getDefaultColorPalettes`)
- [ ] Displays palettes in responsive grid layout (3 columns desktop, 2 tablet, 1 mobile)
- [ ] Reuse existing `color-palette` component for individual palette cards OR use new `color-strip` component
- [ ] Each palette card shows:
  - Color strips using `color-strip` component (horizontal, compact 48px height)
  - Support for 3, 5, 6+ colors with equal width distribution
  - Hover state shows hex codes
  - Palette name below strips
  - Action buttons (Edit, Open modal) with icons
- [ ] **Progress Animation** (per Figma node `5674:67799`):
  - Skeleton states (Skeleton 1, 2, 3) for loading palettes
  - Progress indicator overlay on color strips during save/load
  - Gradient animation for skeleton text and icons
  - Support for Color, Gradient, and Image types
- [ ] States: Default, Focused, Hover, Skeleton (loading)
- [ ] Desktop and Mobile breakpoints (different heights: 80px desktop, 56px mobile)
- [ ] Shows loading state while fetching (use `progress-circle` component)
- [ ] Handles error states gracefully
- [ ] Displays "1.5K color palettes" count in header

### Technical Notes
- **Block Pattern**: Follow `color-tools` block variant pattern
- **Variant Detection**: 
  ```javascript
  const variant = block.classList.contains('grid') ? 'grid' :
                  block.classList.contains('modal') ? 'modal' :
                  // ... other variants
                  'grid'; // default
  ```
- **Web Component**: `express/code/libs/color-components/components/palette-grid-container/`
- Convert existing block code to Web Component pattern (like `global-colors-ui`, `color-palette-list`)
- Reference API integration pattern from `global-colors-ui` component
- API endpoint: `/api/color/search?sort=popular&timeRange=all` (or similar)
- Block decorator instantiates: `<palette-grid-container></palette-grid-container>` for grid variant

### Dependencies
- API endpoint must be available
- Color component utilities available
- Existing block structure can be converted to Web Component

---

## Ticket 2: Palette Block - Filter Dropdowns (Grid Variant)
**Priority**: High  
**Story Points**: 3 | **Estimated Hours**: 12-16 hours (1.5-2 days)  
**Component**: `palette-grid-container` Web Component

### Description
Implement three filter dropdowns for the Grid variant that allow users to filter and sort palettes. Includes desktop and mobile variants, filter/sort buttons, and filter panel.

### Acceptance Criteria
- [ ] Three dropdown filters rendered in header (Grid variant only):
  - **Filter 1**: "Color palettes" (Type filter)
    - Options: Color palettes, Color gradients
    - Default: "Color palettes"
    - Desktop and mobile variants
  - **Filter 2**: "Most popular" (Sort filter)
    - Options: Most popular, All, Most used, Random
    - Default: "Most popular"
  - **Filter 3**: "All time" (Time Period filter)
    - Options: All time, This month, This week
    - Default: "All time"
- [ ] Dropdowns use existing `picker` widget (`express/code/scripts/widgets/picker.js`)
- [ ] Dropdowns support open/closed states (per Figma node `5674:67796`)
- [ ] **Filter/Sort Buttons** (alternative to dropdowns):
  - "Filter" button with funnel icon
  - "Sort" button with up/down arrow icon
  - Buttons open filter/sort panel
- [ ] **Filter/Sort Panel** (when buttons clicked):
  - "Sort by" section with options (Most popular, All, Most used, Random)
  - Time-based options (All time, This month, This week)
  - "Filter by" section with options (Color palettes, Color gradients)
  - "Apply" button for each section
- [ ] Dropdowns are properly styled to match Figma design
- [ ] Dropdowns are responsive (stack on mobile, different layout)
- [ ] Filter state is maintained in Web Component (`@state()` properties)
- [ ] Filters only appear in Grid variant (not in Modal, Card, etc.)

### Technical Notes
- **Existing Work**: Filter structure already exists in current block code
- **Web Component**: Integrate filters into `palette-grid-container` Web Component
- Use `createPicker` function from `express/code/scripts/widgets/picker.js` (vanilla JS widget)
- Store filter state as `@state()` properties in Lit Element
- Filters should trigger API calls (see Ticket 3)
- Integrate picker widgets into Web Component render method using `firstUpdated()` lifecycle
- May need to wrap picker widgets in Web Component or use imperative DOM manipulation
- **Filter Panel**: Modal/overlay component for Filter and Sort buttons
  - Opens when Filter or Sort button clicked
  - Contains "Sort by" and "Filter by" sections
  - Each section has "Apply" button
  - Can reuse existing modal/dialog component or create new
- **Desktop vs Mobile**: Different layouts per Figma node `5674:67796`
  - Desktop: Horizontal dropdown layout
  - Mobile: Stacked layout or Filter/Sort buttons

### Dependencies
- Ticket 1 (Grid Variant) should be complete or in progress
- Picker widget available

---

## Ticket 3: Explore Palettes Block - API Integration for Filters
**Priority**: High  
**Story Points**: 3 | **Estimated Hours**: 12-16 hours (1.5-2 days)  
**Component**: `express/code/blocks/explore-palettes` Web Component

### Description
Connect filter dropdowns to API calls to update displayed palettes based on selected filters.

### Acceptance Criteria
- [ ] Filter changes trigger API calls with correct parameters:
  - Type filter → `type` parameter
  - Sort filter → `sort` parameter  
  - Time Period filter → `timeRange` parameter
- [ ] API calls are debounced/throttled appropriately
- [ ] Loading state shown during API calls (use `progress-circle` component)
- [ ] Palette grid updates with filtered results
- [ ] Error handling for failed API calls
- [ ] Abort previous requests when new filter selected (use AbortController)
- [ ] URL parameters reflect current filter state (optional enhancement)

### Technical Notes
- **Web Component**: API integration happens in `explore-palettes-container` Web Component
- **Existing Pattern**: Can reference `searchPalettes` and `getDefaultColorPalettes` from color components
- Use AbortController for request cancellation (pattern exists in `global-colors-ui`)
- API endpoint format: `/api/color/search?q={query}&sort={sort}&timeRange={timeRange}&type={type}`
- Follow event-driven pattern similar to `color-search` component
- Use `@state()` properties to track filter values and trigger `updated()` lifecycle
- Watch filter properties using `willUpdate()` or property watchers and call API when they change
- Use `@property()` decorators for filter values that trigger API calls

### Dependencies
- Ticket 1 (Display Section)
- Ticket 2 (Filter Dropdowns)
- API endpoint supports filter parameters

---

## Ticket 4: Explore Palettes Block - Search Bar Integration
**Priority**: Medium  
**Story Points**: 3 | **Estimated Hours**: 12-16 hours (1.5-2 days)  
**Component**: `express/code/blocks/search-marquee` (vanilla JS) + `explore-palettes-container` (Web Component)

### Description
Integrate existing search bar block (`search-marquee`) with the Web Component to filter palettes by search query.

### Acceptance Criteria
- [ ] Enhance existing `search-marquee` block to dispatch CustomEvent when search is submitted
- [ ] Web Component (`explore-palettes-container`) listens for search events
- [ ] Search query updates palette grid via API call
- [ ] Search uses same API endpoint as filters
- [ ] Search query parameter passed to API: `q={searchQuery}`
- [ ] Search results replace current palette display
- [ ] Clear search resets to default palettes
- [ ] Search state persists when filters change
- [ ] Search and filters work together (combined query)

### Technical Notes
- **Enhancement**: Modify existing `search-marquee` block (vanilla JS) to dispatch CustomEvent
- Web Component listens for CustomEvent: `ac-palette-search` or similar
- Use CustomEvents for cross-block communication (vanilla JS → Web Component)
- API endpoint: `/api/color/search?q={query}&sort={sort}&timeRange={timeRange}&type={type}`
- Web Component can listen for CustomEvents from search bar using `addEventListener` in `connectedCallback`
- Consider using BlockMediator or document-level event system for cross-block communication
- Search bar remains vanilla JS, Web Component handles the API call

### Dependencies
- Ticket 1 (Display Section)
- Ticket 2 (Filter Dropdowns)
- Ticket 3 (Filter API Integration)
- Existing `search-marquee` block available

---

## Ticket 5: Explore Palettes Block - Search Bar Enhancement (if needed)
**Priority**: Medium  
**Story Points**: 2 | **Estimated Hours**: 8 hours (1 day)  
**Component**: `express/code/blocks/search-marquee` (vanilla JS enhancement)

### Description
Enhance existing `search-marquee` block to match Figma design and integrate with Explore Palettes (if styling/functionality changes needed).

### Acceptance Criteria
- [ ] Search bar matches Figma design (if different from current):
  - Large search input with magnifying glass icon
  - Placeholder: "Search for colors, moods, themes, etc."
  - Rounded corners, proper styling
- [ ] Search bar dispatches CustomEvent for palette search
- [ ] Styling matches Figma specifications
- [ ] Search bar integrates with explore-palettes Web Component

### Technical Notes
- **Enhancement**: Modify existing `search-marquee` block (vanilla JS)
- Only needed if current `search-marquee` doesn't match design or needs palette-specific behavior
- If current block works, this ticket may be minimal or unnecessary
- Focus on CustomEvent dispatch for Web Component communication

### Dependencies
- Design confirmation on search bar requirements
- Ticket 4 may depend on this (if styling changes needed)

---

## Ticket 6: Explore Palettes Block - Palette Card Actions
**Priority**: Low  
**Story Points**: 3 | **Estimated Hours**: 12-16 hours (1.5-2 days)  
**Component**: `express/code/blocks/explore-palettes` Web Component

### Description
Implement action buttons on each palette card. Based on Figma node `5674:67793`, includes comprehensive action button system with multiple states and sizes.

### Acceptance Criteria
- [ ] **Action Buttons** (per Figma node `5674:67793`):
  - **Primary Actions**: Edit (pencil), Open modal (square with arrow)
  - **Secondary Actions**: Share, Download, Save to CC library (optional on cards)
- [ ] **Button States**:
  - Default, Hover, Active, Focus, Disabled
  - Light and Dark theme support
  - Size variants: M (32px) and S (24px)
- [ ] **Color Action Buttons** (for modal/color strips):
  - Remove color, Change tint, Change color, Move color
  - Shuffle, Copy hex, Lock/Unlock color
  - Create palette, Contrast checker, Color blindness simulator
  - Undo/Redo, Expand/Minimize, Swap, Drag
  - Add color, Upload new photo, Reset
- [ ] Buttons have proper hover states
- [ ] Buttons are accessible (keyboard navigation, ARIA labels, focus rings)
- [ ] Action handlers are wired up (may be placeholders initially)
- [ ] Icons match Figma specifications

### Technical Notes
- **Existing Work**: Action button structure and icons already exist in current code
- Reference existing palette action patterns from color components
- May need to integrate with CC Libraries API for save functionality
- Share functionality may need share dialog component
- Edit may link to color tools or open modal
- Can reuse `color-palette-icon-button` component if it fits the use case

### Dependencies
- Ticket 1 (Display Section)
- CC Libraries API (for save functionality)
- Share dialog component (if needed)

---

## Ticket 7: Explore Palettes Block - Responsive Design & Polish
**Priority**: Medium  
**Story Points**: 1 | **Estimated Hours**: 4 hours (0.5 day)  
**Component**: `express/code/blocks/explore-palettes` Web Component

### Description
Ensure responsive design matches Figma specifications across all breakpoints.

### Acceptance Criteria
- [ ] Desktop (1200px+): 3-column grid, filters horizontal
- [ ] Tablet (768px-1199px): 2-column grid, filters may stack
- [ ] Mobile (<768px): 1-column grid, filters stack vertically
- [ ] All breakpoints tested and match design
- [ ] Touch targets meet accessibility standards
- [ ] Loading states work on all breakpoints
- [ ] Error states are user-friendly

### Technical Notes
- **Existing Work**: Responsive CSS already exists in `explore-palettes.css`
- May need minor adjustments when converting to Web Component
- Test on multiple devices/browsers
- Ensure proper spacing and typography scaling
- Move CSS to Web Component's `styles.css.js` file

### Dependencies
- All previous tickets

---

## Ticket 8: Explore Palettes Block - Analytics & Tracking
**Priority**: Low  
**Story Points**: 2 | **Estimated Hours**: 8 hours (1 day)  
**Component**: `express/code/blocks/explore-palettes`

### Description
Add analytics tracking for user interactions.

### Acceptance Criteria
- [ ] Track palette card clicks
- [ ] Track filter changes
- [ ] Track search queries
- [ ] Track action button clicks (Edit, Share, Save)
- [ ] Track API call performance
- [ ] Follow existing analytics patterns in codebase

### Technical Notes
- Reference analytics patterns from `color-search` component
- Use existing analytics utilities
- Track events: `ac-global-themes-analytics` pattern

### Dependencies
- All functional tickets complete

---

## Implementation Order Recommendation

### Phase 1: Core Display & Filtering (Foundation)
1. **Ticket 1** - Display Section (Web Component) - 12-16 hours
2. **Ticket 2** - Filter Dropdowns (Web Component) - 8 hours
3. **Ticket 3** - Filter API Integration (Web Component) - 12-16 hours
4. **Ticket 5** - Search Bar Enhancement (Vanilla JS, if needed) - 8 hours
5. **Ticket 4** - Search Integration (Vanilla JS → Web Component) - 12-16 hours

### Phase 2: Modal Implementation (Detailed View)
6. **Ticket 9** - Modal Basic Structure - 12-16 hours
7. **Ticket 10** - Color Display & Actions - 12-16 hours
8. **Ticket 11** - Save to CC Libraries - 20-24 hours
9. **Ticket 12** - Toast Notifications - 8 hours
10. **Ticket 13** - Action Buttons & Integration - 12-16 hours

### Phase 3: Polish & Enhancement
11. **Ticket 6** - Palette Card Actions (Web Component) - 8 hours
12. **Ticket 7** - Responsive Design (Polish) - 4 hours
13. **Ticket 8** - Analytics (Final) - 8 hours

**Total Estimated Hours**: 
- **Phase 1 (Core)**: 60-72 hours (7.5-9 days) - *Updated: Added color strip component work*
- **Phase 2 (Modal)**: 68-84 hours (8.5-10.5 days) - *Updated: Added color strip component details*
- **Phase 3 (Polish)**: 20 hours (2.5 days)
- **Grand Total**: 148-176 hours (18.5-22 working days for 1 developer)

**Note**: Estimates reduced because:
- Basic block structure and CSS already exist in `color-poc` branch
- Can reuse existing `color-palette` Web Components
- Converting existing code to Web Component pattern is faster than building from scratch
- Search bar is enhancement to existing block, not new build

---

## Open Questions / Decisions Needed

1. **API Endpoint**: Confirm exact API endpoint and parameters
   - Current assumption: `/api/color/search?q={query}&sort={sort}&timeRange={timeRange}&type={type}`
   
2. **Search Bar**: Can we reuse `search-marquee` block or need new component?
   - Check if `search-marquee` can be adapted for this use case
   
3. **State Management**: How should search and filter state be shared?
   - CustomEvents?
   - BlockMediator?
   - URL parameters?
   
4. **Palette Count**: Is "1.5K color palettes" dynamic or static?
   - Should it update based on current filter results?
   
5. **Initial Load**: What are the default filter values?
   - Type: "Color palettes"?
   - Sort: "Most popular"?
   - Time: "All time"?
   
6. **Pagination**: Is pagination needed or infinite scroll?
   - Design shows "Load more" button but user said not needed
   - How many palettes per page?

7. **Orientation Variants**: 
   - ✅ **RESOLVED**: Orientation determined via authoring variants (`horizontal` or `vertical`)
   - Default orientation if no variant specified?
   - Should responsive width-based changes override variant, or variant always take precedence?
   - Breakpoint values for auto-orientation switching?

---

## Color Strip Component - Detailed Specifications

### Overview
The Color Strip component is a reusable component used throughout the Palette Block to display individual colors. It appears in both grid cards and modal views, with different orientations and sizes based on context.

### Component Properties (from Figma Documentation)

#### Size Variants
- **Size L (Large)**: 648x600px (vertical), 648x48px (horizontal)
  - Used in desktop modal views
  - Full-size color display
  
- **Size M (Medium)**: 397x600px (vertical), 397x48px (horizontal)
  - Used in tablet/medium screen contexts
  - Compact layout
  
- **Size S (Small)**: 278x600px (vertical), 278x48px (horizontal)
  - Used in mobile/small screen contexts
  - Minimal width for stacked layouts

#### Orientation Variants
- **Horizontal**: Colors displayed side-by-side
  - Used in grid card views
  - Width varies based on color count
  - Height: 48px (compact) or 400px (full)
  
- **Vertical**: Colors displayed stacked vertically
  - Used in modal views
  - Height: 600px (full) or 48px (compact)
  - Width varies based on container

#### Color Count Variants
- **3 Colors**: Equal width distribution (e.g., 214.67px each for 648px container)
- **5 Colors**: Equal width distribution (e.g., 165.2px each for 834px container)
- **6 Colors**: Equal width distribution (e.g., 231.67px each for 1400px container)
- **Dynamic**: Supports any number of colors with equal distribution

#### States & Features
- **Default State**: Color display with background color
- **With Hex Code**: Hex code displayed on hover or always visible
- **Hover State**: Shows hex code, copy button, or additional actions
- **Focused State**: Focus ring for keyboard navigation
- **Progress Animation** (per Figma node `5674:67799`):
  - Skeleton states (Skeleton 1, 2, 3) for loading
  - Gradient animation on skeleton text and icons
  - Progress indicator overlay on color strips
  - Supports Color, Gradient, and Image types
- **Copy Functionality**: Click to copy hex code to clipboard
- **Accessibility**: ARIA labels, keyboard navigation support

#### Layout Variants
- **Single Strip**: One color strip (full width/height)
- **Multiple Strips**: Multiple color strips in container
  - Horizontal: Side-by-side arrangement
  - Vertical: Stacked arrangement
- **Grid Layout**: Multiple strips in grid (2x2, 3x1, etc.)

### Usage Contexts

#### Grid Card View
- **Orientation**: Horizontal
- **Size**: Compact (48px height)
- **Color Count**: Typically 5 colors
- **Features**: Hover to show hex codes, click to open modal

#### Modal View
- **Orientation**: Vertical (default)
- **Size**: Large (600px height)
- **Color Count**: 5-10 colors
- **Features**: Always show hex codes, copy buttons, individual color actions

#### Responsive Behavior
- **Desktop**: Large size, horizontal in grid, vertical in modal
- **Tablet**: Medium size, adapts orientation based on space
- **Mobile**: Small size, vertical stacking preferred

### Implementation Notes
- **Component Name**: `color-strip` (reusable Web Component)
- **Location**: `express/code/libs/color-components/components/color-strip/`
- **Reusability**: Used in both grid cards and modal views
- **Props**: 
  - `colors` (array of hex codes)
  - `orientation` ('horizontal' | 'vertical')
  - `size` ('l' | 'm' | 's')
  - `showHexCodes` (boolean)
  - `showCopyButton` (boolean)
  - `interactive` (boolean)

### Design References
- **Component Documentation**: Node `6180:230471` (Color-strip component specs)
- **Usage Example**: Node `6215:344297` (Explore palettes page with color strips)
- **Properties Table**: See Figma for complete API documentation
- **Filter Section**: Node `5674:67796` (Title & filter with dropdowns and panel)
- **Palette Swatch**: Node `5674:67799` (Swatch with progress animation and states)
- **Action Buttons**: Node `5674:67793` (Complete action button system with all states)

### Additional Component Details from Figma

#### Filter Section Details (Node `5674:67796`)
- **Desktop Layout**: Three horizontal dropdowns side-by-side
- **Mobile Layout**: Stacked dropdowns or Filter/Sort buttons
- **Filter/Sort Panel**: Modal/overlay with "Sort by" and "Filter by" sections
- **Filter Options**: Type (Color palettes, Color gradients), Sort (Most popular, All, Most used, Random), Time (All time, This month, This week)

#### Palette Swatch Details (Node `5674:67799`)
- **States**: Default, Focused, Hover, Skeleton (1, 2, 3)
- **Progress Animation**: Gradient animation on skeleton states, progress indicator overlay
- **Types**: Color, Gradient, Image (descoped)
- **Breakpoints**: Desktop (80px height), Mobile (56px height)
- **Action Buttons**: Edit, Open modal

#### Color Action Buttons System (Node `5674:67793`)
- **25+ Action Types**: Edit, Share, Download, Save to CC library, Remove color, Change tint, Move color, Lock/Unlock, Copy hex, and more
- **States**: Default, Hover, Active, Focus, Disabled
- **Sizes**: M (32px), S (24px)
- **Themes**: Light and Dark
- **Reusable Component**: `color-action-button` with consistent state system

---

## Related Files & Components

### Existing Components to Reference
- `express/code/blocks/search-marquee/search-marquee.js` - Search bar pattern
- `express/code/libs/color-components/components/color-search/index.js` - Search integration
- `express/code/libs/color-components/components/global-colors-ui/index.js` - API integration pattern
- `express/code/libs/color-components/components/color-palette-list/index.js` - Palette list display
- `express/code/scripts/widgets/picker.js` - Dropdown widget

### New Files Created (in color-poc branch)
- `express/code/blocks/explore-palettes/explore-palettes.js` - Block decorator (exists, needs Web Component integration)
- `express/code/blocks/explore-palettes/explore-palettes.css` - Styles (exists, may need to move to Web Component)

### Palette Block Structure
- `express/code/blocks/palette/palette.js` - Block decorator (vanilla JS, detects variant, instantiates Web Component)
- `express/code/blocks/palette/palette.css` - Block-level styles (minimal, variant-specific styles in Web Components)

### Web Components to Create
- `express/code/libs/color-components/components/palette-grid-container/index.js` - Grid variant Web Component (Lit Element)
- `express/code/libs/color-components/components/palette-grid-container/styles.css.js` - Grid variant styles
- `express/code/libs/color-components/components/palette-modal-container/index.js` - Modal variant Web Component (Lit Element)
- `express/code/libs/color-components/components/palette-modal-container/styles.css.js` - Modal variant styles
- `express/code/libs/color-components/components/palette-display-container/index.js` - Horizontal/Vertical/Card variants (Lit Element)
- `express/code/libs/color-components/components/palette-display-container/styles.css.js` - Display variant styles
- `express/code/libs/color-components/components/color-strip/index.js` - Reusable color strip component (Lit Element)
- `express/code/libs/color-components/components/color-strip/styles.css.js` - Color strip styles
- `express/code/libs/color-components/components/color-strip/index.js` - Reusable color strip component (Lit Element)
- `express/code/libs/color-components/components/color-strip/styles.css.js` - Color strip styles

### Search Bar (Enhancement)
- `express/code/blocks/search-marquee/search-marquee.js` - Existing block (vanilla JS, needs enhancement for CustomEvent dispatch)

### Documentation
- `express/docs/color-tools-backend-services.md` - API documentation

---

## Explore Palettes Modal - Feature Breakdown

### Overview
The Explore Palettes Modal is a detailed view that appears when a user clicks on a palette card. It displays palette details, actions, and allows saving to Creative Cloud Libraries. The modal uses the main palette block with different views and includes many small features.

### Modal Variants & States

Based on Figma documentation node `5639:126802`, the modal has multiple variants:

#### Modal Sizes
1. **Size L (Large)** - 898x604px
   - Desktop full-size modal
   - Maximum content display
   
2. **Size M (Medium)** - 600x480px (or 600x532px for gradients)
   - Tablet/medium screen size
   - Compact layout
   
3. **Size S (Small)** - 375x514px (or 375x466px for gradients)
   - Mobile/small screen size
   - Stacked vertical layout

#### Modal Types
1. **Color Palette Type**
   - Standard color palette display
   - Vertical color strips
   - Hex codes with copy functionality
   
2. **Gradient Type**
   - Gradient display variant
   - Different layout for gradient visualization
   - Similar metadata and actions

#### Modal States

##### 1. **Libraries Closed** (`Libraries open?=No`)
- **Node IDs**: 
  - L: `5517:205660` (Color palette), `5711:61506` (Gradient)
  - M: `5517:205659` (Color palette), `5711:193258` (Gradient)
  - S: `5714:60551` (Color palette), `5517:205658` (Gradient)
- **Description**: Default modal view with libraries dropdown closed
- **Features**:
  - Vertical color strips with hex codes
  - Copy hex code buttons for each color
  - Palette name and creator info
  - Like count display
  - Tags display
  - Action buttons (Edit, Share, Download, Save)
  - "Open palette in Adobe Express" button
  - Libraries dropdown (closed state)

##### 2. **Libraries Open** (`Libraries open?=Yes`)
- **Node IDs**:
  - L: `5708:240182` (Color palette), `5738:203152` (Gradient)
  - M: `5708:242521` (Color palette), `5738:204803` (Gradient)
  - S: `5708:242874` (Color palette), `6407:346556` (Gradient)
- **Description**: Modal with "Save to Creative Cloud Libraries" form expanded
- **Features**:
  - All features from Libraries Closed state
  - **Save Form Expanded**:
    - Palette name input field
    - "Save to" dropdown (library selection) - **OPEN STATE**
    - Tags input with autocomplete/suggestions
    - Pre-selected tags display
    - "Save to library" button (or "Sign in to save" if not authenticated)
  - Modal height increases to accommodate form

##### 3. **Library Dropdown States** (Node: `5695:212305`)
- **Dropdown Closed** (`Dropdown open?=No`)
  - Desktop: `5695:180835`
  - Mobile: `5708:243426`
  
- **Dropdown Open - Default** (`Dropdown open?=Yes, Create library=Default`)
  - Desktop: `5695:212306`
  - Mobile: `5708:244023`
  - Shows list of existing libraries
  
- **Dropdown Open - Typed** (`Dropdown open?=Yes, Create library=Typed`)
  - Desktop: `5698:176387`
  - Mobile: `5708:244050`
  - User typing in "Create library" field
  
- **Dropdown Open - Enter** (`Dropdown open?=Yes, Create library=Enter`)
  - Desktop: `5698:176729`
  - Mobile: `5708:244077`
  - User pressed Enter to create library

##### 4. **Success Toast Notification**
- **Node ID**: `5708:241518`
- **Description**: Toast notification appears after successful save
- **Features**:
  - Success message: "Color palette successfully added to 'Your Library'"
  - "View" button to navigate to library
  - Dismiss button (X)
  - Auto-dismiss after timeout
  - Positioned bottom-right
  - Size: 467x56px

### Modal Features Breakdown

#### Color Display Features
- **Orientation Variants**: 
  - **Vertical Strips**: Each color displayed as a vertical strip (default for modal)
  - **Horizontal Strips**: Colors displayed horizontally (variant option)
  - **Responsive**: Orientation can change based on container width
- **Hex Code Display**: Hex code shown below each color
- **Copy Hex Code**: Icon button to copy hex code to clipboard
- **Color Actions** (on hover):
  - Lock/Unlock color
  - Change tint
  - Move color
  - Remove color
- **Dynamic Color Count**: Supports 5-10+ colors with responsive layout
- **Authoring Variants**: Orientation determined via block variant (`horizontal` or `vertical`)

#### Palette Metadata
- **Palette Name**: Title of the palette
- **Creator Info**: Profile picture + username
- **Like Count**: Heart icon + count (e.g., "1.2K")
- **Tags**: Pill-shaped tags (e.g., "Orange", "Cinematic", "Summer", "Water")
- **Palette Summary**: Mini horizontal palette preview

#### Action Buttons
- **Edit Button**: Opens palette editor (pencil icon)
- **Share Button**: Opens share dialog
- **Download Button**: Downloads palette
- **Save to CC Library**: Saves to Creative Cloud Libraries
- **Copy Button**: Copies palette data
- **Open in Adobe Express**: Primary CTA button

#### Save to CC Libraries Form
- **Palette Name Input**: Text field with placeholder "My Color Theme"
- **Save To Dropdown**: Library selection dropdown
- **Tags Input**: Text input with autocomplete
- **Tag Suggestions**: Pre-populated tag suggestions below input
- **Selected Tags**: Display selected tags as removable chips
- **Save Button**: Primary action button
- **Sign In State**: Shows "Sign in to save" if user not authenticated

#### Modal Behavior
- **Backdrop**: Blurred background overlay
- **Close Button**: X button in top-right corner
- **Keyboard Navigation**: ESC to close, Tab navigation
- **Focus Management**: Trap focus within modal
- **Responsive**: Adapts to different screen sizes

### Technical Implementation Notes

#### Web Component Architecture
- **Component Name**: `palette-modal-container` (Lit Element)
- **Location**: `express/code/libs/color-components/components/palette-modal-container/`
- **Reuses**: Main palette display component with different view modes
- **Variant Support**: 
  - **Size Variants**: `size-l`, `size-m`, `size-s` (via CSS classes or properties)
  - **Type Variants**: `color-palette`, `gradient` (via properties)
  - **Orientation**: Accepts `orientation` property (`horizontal` | `vertical`)
- **State Management**: 
  - Modal open/closed state
  - Libraries form open/closed (`librariesOpen` property)
  - Library dropdown open/closed (`dropdownOpen` property)
  - Create library input state (`createLibraryState`: 'default' | 'typed' | 'enter')
  - Selected library
  - Tag selections
  - Authentication state
  - Orientation state (horizontal/vertical)
  - Responsive size detection (L/M/S based on viewport)

#### Integration Points
- **Opens from**: Palette card click in `explore-palettes-container`
- **Event**: `ac-palette-card-click` → opens modal with palette data
- **Closes via**: Close button, backdrop click, ESC key
- **Saves via**: CC Libraries API integration

#### Dependencies
- CC Libraries API for save functionality
- Authentication service for sign-in state
- Toast notification component (or create new)
- Modal/dialog component (or create new)
- Clipboard API for copy functionality

### Estimated Work Breakdown

**Ticket 9: Palette Block - Modal Variant Basic Structure**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Create `palette-modal-container` Web Component
- Implement backdrop and close functionality
- Support size variants (L/M/S) - responsive detection
- Support type variants (Color palette/Gradient)
- Basic palette display integration
- Libraries form state management (open/closed)

**Ticket 10: Explore Palettes Modal - Color Display & Actions**
- **Story Points**: 5 | **Hours**: 20-24 hours
- **Color Strip Component** (reusable, shared with grid cards):
  - Size variants (L: 648px, M: 397px, S: 278px)
  - Orientation variants (horizontal/vertical)
  - Color count support (3, 5, 6+ colors with equal distribution)
  - Hover states and interactions
  - Hex code display (always visible in modal, on hover in grid)
  - Copy hex code functionality
  - Progress animation support (skeleton states)
- **Color Action Buttons** (per Figma node `5674:67793`):
  - Lock/Unlock color, Change tint, Change color, Move color, Remove color
  - Shuffle, Copy hex, Create palette
  - Contrast checker, Color blindness simulator
  - All buttons with states: Default, Hover, Active, Focus, Disabled
  - Light and Dark theme support
  - Size variants: M (32px) and S (24px)
- Dynamic color count support (5-10+ colors)
- Responsive orientation based on container width
- Variant support via authoring (horizontal/vertical)

**Ticket 11: Palette Block - Modal Variant Save to CC Libraries**
- **Story Points**: 5 | **Hours**: 20-24 hours
- Save form UI (expands when libraries open)
- Library selection dropdown with states:
  - Closed state
  - Open - default (shows libraries)
  - Open - typed (user typing)
  - Open - enter (creating library)
- Tags input with autocomplete
- CC Libraries API integration
- Authentication state handling ("Sign in to save" vs "Save to library")
- Desktop and mobile variants for dropdown

**Ticket 12: Explore Palettes Modal - Toast Notifications**
- **Story Points**: 2 | **Hours**: 8 hours
- Success toast component
- Error toast handling
- Auto-dismiss functionality
- "View" button navigation

**Ticket 13: Explore Palettes Modal - Action Buttons & Integration**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Edit, Share, Download, Save buttons
- "Open in Adobe Express" button
- Integration with palette card clicks
- Event handling and communication

**Total Modal Work**: 13-16 SP | 64-80 hours (8-10 days)

---

## Total Estimates

### Explore Palettes Feature
- **Core Features (Tickets 1-8)**: 20-24 SP | 80-96 hours (10-12 days)
- **Modal Features (Tickets 9-13)**: 13-16 SP | 64-80 hours (8-10 days)
- **Total**: 33-40 SP | 144-176 hours (18-22 days)

---

## Notes
- Estimates assume existing codebase patterns and reusable components
- Color Strip and Action Button components are shared with Extract Palette feature (see `EXTRACT_PALETTE_JIRA_TICKETS.md`)
- Backend API integration effort is included in component tickets
- Testing and polish work is included in estimates
- Responsive design work is factored into each ticket
- See `EXTRACT_PALETTE_JIRA_TICKETS.md` for Extract Palette feature documentation

