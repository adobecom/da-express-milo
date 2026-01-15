# Extract Palette Feature - Jira Ticket Breakdown

## Implementation Plan Diagrams

### 1. Component Architecture Flow
[![Component Architecture](https://www.figma.com/online-whiteboard/create-diagram/d67c3da8-17a0-43ae-bb81-8758c124ef51)](https://www.figma.com/online-whiteboard/create-diagram/d67c3da8-17a0-43ae-bb81-8758c124ef51)

**Shows the technical architecture:**
- Block Layer → Web Components → Vanilla JS → API Layer
- How components interact and communicate
- Reusable components (Color Strip, Action Button)
- Variant detection and routing

### 2. Implementation Plan Flow
[![Implementation Plan](https://www.figma.com/online-whiteboard/create-diagram/03c9af35-49da-4296-bfce-99fc204cd6d8)](https://www.figma.com/online-whiteboard/create-diagram/03c9af35-49da-4296-bfce-99fc204cd6d8)

**Shows the feature flow:**
- Variant detection and routing
- Component dependencies and relationships
- Ticket relationships and dependencies
- Phase progression

### 3. Implementation Timeline
[![Implementation Timeline](https://www.figma.com/online-whiteboard/create-diagram/d7a1a4bf-0486-4f88-a92d-05da56315855)](https://www.figma.com/online-whiteboard/create-diagram/d7a1a4bf-0486-4f88-a92d-05da56315855)

**Shows the Gantt chart timeline:**
- Phase 1: Foundation (Tickets 1, 2, 11)
- Phase 2: Core Extraction (Tickets 3, 4, 5)
- Phase 3: Advanced Features (Tickets 6, 7, 8, 9)
- Phase 4: Polish (Ticket 10)
- Critical path and dependencies

## Overview

The Extract Palette feature allows users to upload images and extract color palettes or gradients from them. This includes an upload interface, image processing, color extraction, and result display with editing capabilities.

## Architecture Notes

- **Block Name**: `extract-palette` (or `extract-color`)
- **Technology**: Lit Web Components for main functionality, vanilla JS for upload handling
- **Backend Services**: Image processing API, Color extraction API (see `color-tools-backend-services.md`)
- **Responsive**: Desktop (XL/L), Tablet (M), Mobile (S) variants
- **Key Features**: Image upload, color extraction, gradient extraction, image effects, color editing

## Summary of Key Components

### Block Layer
- **Extract Palette Block**: `extract-palette` (or `extract-color`)
  - **Variant Detection**: Routes to palette or gradient extraction flow
  - **Variants**: `(palette)`, `(gradient)`

### Web Components (Lit Elements)
- `extract-palette-container` - Main extraction flow container
- `upload-area` - Drag & drop upload component
- `extract-result` - Result display with image and colors
- `floating-toolbar` - Action toolbar component
- `image-reveal` - Before/after comparison slider
- `gradient-editor` - Gradient stop editing component

### Shared Components
- `color-strip` - Reusable color display component (shared with Explore Palettes)
- `color-action-button` - Reusable action button system (shared with Explore Palettes)

### Vanilla JS (Enhanced)
- `upload-service` - File upload handling (if available)

### API Integration
- Image Processing API - Image upload and processing
- Color Extraction API - Extract colors from images
- Gradient Processing API - Extract gradients from images
- CC Libraries API - Save extracted palettes/gradients

## Component Breakdown

**Ticket 1: Extract Palette - Upload Area Component**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Upload drop zone with drag & drop
- File input handling (JPEG, JPG, PNG, WebP, up to 40MB)
- States: Default, Hover, Active (drag over), Focus, Disabled
- "Or drag and drop here" messaging
- File validation and error handling
- Integration with existing `UploadService` if available
- Responsive sizing (Desktop/Tablet/Mobile)
- Image widget with sample thumbnails ("Don't have an image? Try one of ours")
- Color thumbnail previews with color strips

**Ticket 2: Extract Palette - Loading State**
- **Story Points**: 2 | **Hours**: 8 hours
- Loading skeleton/spinner during image processing
- Progress indication
- Responsive layouts for all breakpoints
- Error state handling

**Ticket 3: Extract Palette - Extract Result Display**
- **Story Points**: 5 | **Hours**: 20-24 hours
- Display extracted image with overlay
- Color strip component showing extracted colors (5-10 colors)
- Gradient display option (if gradient extraction selected)
- Image metadata display
- Responsive layouts (XL, L, M, S)
- Color count display
- Palette/gradient toggle
- Image aspect ratio handling (Horizontal, Landscape, Portrait)

**Ticket 4: Extract Palette - Color Strip Component**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Horizontal color strip display
- Color count: 5-10 colors (expandable)
- Individual color swatches with hex codes
- Click to copy hex code
- Hover states
- Responsive sizing (Desktop/Tablet/Mobile)
- Integration with existing `color-strip` component if available
- Color selection/highlighting

**Ticket 5: Extract Palette - Floating Toolbar**
- **Story Points**: 4 | **Hours**: 16-20 hours
- Floating toolbar with action buttons
- Actions: Create palette, Save to library, Download, Share, Edit
- CC Libraries integration (open/closed states)
- Responsive layouts:
  - XL/Widescreen: Horizontal toolbar (72px height)
  - L/Desktop: Horizontal toolbar (72px height)
  - M/Tablet: Vertical toolbar (136px height, expandable)
  - S/Mobile: Vertical toolbar (136px height, expandable)
- Library dropdown when "Libraries open=Yes"
- Create palette button variants (L and S sizes)
- State management for toolbar visibility

**Ticket 6: Extract Palette - Image Reveal Component**
- **Story Points**: 4 | **Hours**: 16-20 hours
- Before/after image comparison slider
- Interactive slider handle
- Image overlay effects
- Tab functionality: "Add an image effect" / "Try a different image"
- Responsive slider controls:
  - Desktop XL: 80px handle
  - Desktop L: Standard size
  - Tablet M: Medium size
  - Mobile S: 48px handle
- Step-by-step reveal animation (Steps 1, 2, 3)
- Image comparison states

**Ticket 7: Extract Palette - Color Editing Handles**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Interactive color extraction handles on image
- Click and drag to adjust color sampling
- Handle states: Default, Clicked
- Visual feedback for handle position
- Color preview on handle interaction
- Update color strip in real-time

**Ticket 8: Extract Palette - Gradient Editor**
- **Story Points**: 4 | **Hours**: 16-20 hours
- Gradient stop controls
- Add/remove gradient stops
- Stop states: Default, Pressed, Focused
- Color picker integration for stops
- Gradient preview
- Responsive layouts (Desktop L and Tablet/Mobile S)
- Gradient angle/direction controls

**Ticket 9: Extract Palette - Extract Gradient Variant**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Gradient extraction mode (vs color palette)
- Gradient display component
- Gradient editing interface
- Toggle between palette and gradient modes
- Gradient-specific toolbar actions
- Responsive layouts for all breakpoints

**Ticket 10: Extract Palette - Image Effects Integration**
- **Story Points**: 2 | **Hours**: 8 hours
- Image effect application
- Effect preview
- Before/after comparison
- Effect selection UI
- Integration with image reveal component

**Ticket 11: Extract Palette - Main Page Integration**
- **Story Points**: 3 | **Hours**: 12-16 hours
- Block decorator for `extract-palette`
- Variant detection (palette vs gradient)
- Page state management (upload → loading → result)
- Navigation integration (wayfinding)
- Responsive breakpoint handling
- Component orchestration
- Event handling between components

## Ticket Dependencies

```
Phase 1: Foundation
├── Ticket 1: Upload Area Component (foundation)
│   └── Required for all extraction flows
├── Ticket 2: Loading State
│   └── Required for user feedback
└── Ticket 11: Main Page Integration
    └── Orchestrates all components

Phase 2: Core Extraction
├── Ticket 3: Extract Result Display
│   ├── Depends on: Ticket 1, Ticket 2
│   └── Uses: Ticket 4 (Color Strip)
├── Ticket 4: Color Strip Component
│   └── Shared component, reusable
└── Ticket 5: Floating Toolbar
    ├── Depends on: Ticket 3
    └── Uses: Shared Action Buttons

Phase 3: Advanced Features
├── Ticket 6: Image Reveal Component
│   └── Depends on: Ticket 3
├── Ticket 7: Color Editing Handles
│   ├── Depends on: Ticket 3, Ticket 4
│   └── Updates color strip in real-time
├── Ticket 8: Gradient Editor
│   └── Depends on: Ticket 9 (Gradient Variant)
└── Ticket 9: Extract Gradient Variant
    ├── Depends on: Ticket 1, Ticket 2, Ticket 3
    └── Uses: Ticket 8 (Gradient Editor)

Phase 4: Polish
└── Ticket 10: Image Effects Integration
    └── Depends on: Ticket 6 (Image Reveal)
```

## Estimated Work Breakdown

**Total Extract Palette Work**: 36 SP | 144-180 hours (18-22.5 days)

### Breakdown by Phase:
- **Phase 1: Foundation** (Tickets 1, 2, 11): 8 SP | 32-40 hours (4-5 days)
- **Phase 2: Core Extraction** (Tickets 3, 4, 5): 12 SP | 48-56 hours (6-7 days)
- **Phase 3: Advanced Features** (Tickets 6, 7, 8, 9): 14 SP | 56-72 hours (7-9 days)
- **Phase 4: Polish** (Ticket 10): 2 SP | 8 hours (1 day)

## Notes

- Estimates assume existing codebase patterns and reusable components
- Color Strip and Action Button components are shared with Explore Palettes feature
- Backend API integration effort is included in component tickets
- Testing and polish work is included in estimates
- Responsive design work is factored into each ticket
- Image upload handling may leverage existing `UploadService` if available
- Color extraction algorithms may be ported from existing color tools codebase

