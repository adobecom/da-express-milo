# Color Tools Plans Comparative Review

**Date:** January 5, 2026  
**Purpose:** Compare and reconcile the three planning document sets for Color Tools development

---

## Executive Summary

This document compares three separate planning efforts for the Color Tools project:

1. **color-brad-plans** — Original POC-based documentation with working implementation
2. **color-cano-plan** — Feature-focused planning for Explore Palettes + Extract Palette
3. **color-PLG-plans** — Architectural proposal for layered UI/Data separation

**Key Finding:** These plans represent **three different perspectives** that have significant overlap but also notable disconnects. The POC work in `color-brad-plans` has **already implemented** much of what the other two plans propose architecturally, yet neither Cano's nor PLG's plans appear to fully acknowledge the existing implementation.

---

## 1. What Each Plan Contains

### 1.1 color-brad-plans (Original POC Documentation)

| Document | Purpose | Key Content |
|----------|---------|-------------|
| `README.md` | Block usage | Simple authoring examples for `palette` and `wheel` variants |
| `color-tools-gap-report.md` | Gap analysis | Detailed comparison of legacy colorweb vs POC, identifies 6 major workstreams |
| `color-tools-legacy-audit.md` | Legacy audit | Comprehensive audit of React/Redux implementation in colorweb-develop |
| `color-tools-qa.md` | QA checklist | Manual testing scenarios for wheel, image, tabs, accessibility |
| `color-tools-tracker.md` | Progress tracking | Living tracker with workstream checkboxes |
| `color-project-migration-gaps.md` | Migration risks | Backend/buildless environment constraints, Python portability analysis |
| `color-tools-authoring.md` | Author guide | Section metadata, URL routing, analytics hooks |
| `color-tools-backend-services.md` | API contracts | Ethos, Stock, Libraries, Autotag, Search service specifications |
| `color-tools-dev-handoff.md` | Onboarding | Repo pointers, architecture overview, contribution guidelines |
| `color-tools-demo.md` | Demo page | Example authoring page for testing |

**POC Code Implemented:**
- `ColorThemeController` with pub/sub pattern (subscribers)
- `HarmonyAdapter` wrapping `HarmonyEngine` for color calculations
- Web components: `color-wheel`, `color-palette`, `color-swatch-rail`, `color-harmony-toolbar`
- Basic image extraction via canvas sampling
- Tab routing with URL parameter sync
- localStorage persistence
- Analytics hooks via `express:color-tools-action` events

### 1.2 color-cano-plan (Feature Planning)

| Document | Purpose | Key Content |
|----------|---------|-------------|
| `COLOR_TOOLS_MASTER_PLAN.md` | Master plan | Combined architecture for Explore Palettes + Extract Palette |
| `EXPLORE_PALETTES_JIRA_TICKETS.md` | Ticket breakdown | 13 tickets across 3 phases, 144-176 hours total |
| `EXTRACT_PALETTE_JIRA_TICKETS.md` | Ticket breakdown | 11 tickets across 4 phases, 144-180 hours total |
| `*.png` diagrams | Visual reference | Architecture flows, timelines, dependency graphs |

**Features Scoped:**
- **Explore Palettes**: Grid/modal/horizontal/vertical/card variants, filters, search, CC Libraries integration
- **Extract Palette**: Upload, processing, result display, gradient editing, image effects

**Proposed Components:**
- `palette-grid-container`, `palette-modal-container`, `palette-display-container`
- `extract-palette-container`, `upload-area`, `extract-result`, `floating-toolbar`
- Shared: `color-strip`, `color-action-button`

### 1.3 color-PLG-plans (Architecture Proposal)

| Document | Purpose | Key Content |
|----------|---------|-------------|
| `color-tools-layered-architecture.md` | Architecture | Proposes EventBus, UI Layer, Data Layer separation |

**Key Proposals:**
- Replace direct controller injection with pub/sub EventBus
- Separate presentation components from container components
- Create dedicated StateManager, CalculationEngine, API Services
- Define event topics for USER_INTENT, STATE_UPDATE, API_RESPONSE

---

## 2. Major Alignments

### 2.1 All Plans Agree On

| Topic | Consensus |
|-------|-----------|
| **Lit/Web Components** | Use LitElement for interactive components |
| **Shared components** | Need reusable color-strip/swatch primitives |
| **Event-based communication** | Components should emit semantic events |
| **CC Libraries integration** | Save/export is a critical feature |
| **API abstraction** | Backend services need proxy layer |

### 2.2 Shared Vocabulary

All three plans reference:
- HarmonyEngine for color calculations
- Swatch/palette state management
- Tab-based navigation
- Image extraction workflows
- Analytics tracking patterns

---

## 3. Major Disconnects & Gaps

### 3.1 POC Already Implements What Others Propose

**Critical Observation:** The PLG plan proposes a "new" architecture, but the POC **already has**:

| PLG Proposal | POC Reality |
|--------------|-------------|
| "Create EventBus class" | `ColorThemeController` already has `subscribe()` pattern |
| "State Manager owns state" | `ColorThemeController.theme` is the source of truth |
| "Calculation Engine" | `HarmonyAdapter` already wraps `HarmonyEngine` |
| "Persistence layer" | `_loadState()` / `_saveState()` with localStorage |
| "Analytics Adapter" | `_trackAction()` dispatches `express:color-tools-action` |

**The POC uses direct injection (`controller.setBaseColor()`) but PLG wants events (`eventBus.publish('user.intent.setBaseColor')`).**

### 3.2 Cano Plan Creates New Components vs. Extending POC

**The Cano plan proposes building:**
- `palette-grid-container`
- `palette-modal-container`
- `color-strip`
- `color-action-button`

**But the POC already has:**
- `color-palette` — displays palette with selection events
- `color-palette-list` — renders multiple palettes
- `color-swatch-rail` — vertical swatch display
- `ac-color-swatch` — individual swatch component

**Gap:** Cano's plan appears to be designing from scratch without cataloging what already exists in `libs/color-components/`.

### 3.3 AEM EDS / Franklin Constraints Not Addressed

**Brad's plans explicitly address:**
- Three-phase loading (Eager/Lazy/Delayed)
- `body { display: none }` transformation hiding
- Buildless environment constraints
- 100kb Phase E budget

**Neither Cano nor PLG plans mention:**
- AEM EDS loading phases
- LCP optimization requirements
- Buildless import constraints
- Franklin block patterns

**Risk:** The other plans may produce architectures that violate AEM EDS performance requirements.

### 3.4 Backend Services Understanding

**Brad's `color-tools-backend-services.md` defines:**
- Ethos Theme APIs
- Stock APIs
- CC Libraries
- Autotag
- Universal Search
- Specific proxy endpoint patterns (`/api/color/*`)

**Cano's plan references:**
- "Color API (`/api/color/search`)" — aligns with Brad's
- But doesn't detail auth, error handling, or rate limiting

**PLG's plan mentions:**
- `EthosService`, `StockService`, `LibrariesService` — names only
- No implementation details

### 3.5 Naming Conflicts

| Concept | Brad | Cano | PLG |
|---------|------|------|-----|
| Main block | `color-tools` | `palette` / `explore-palettes` | `color-tools` |
| Swatch display | `color-swatch-rail` | `color-strip` | (not specified) |
| State owner | `ColorThemeController` | (not specified) | `ColorStateManager` |

---

## 4. What Each Plan is Missing

### 4.1 Missing from color-brad-plans

| Gap | Impact |
|-----|--------|
| No JIRA ticket breakdown | Harder to estimate and track |
| No visual diagrams | Less accessible for non-code readers |
| Image extraction is naive | Uses simple pixel sampling, not k-means clustering |
| No Explore Palettes feature | Only Color Tools (wheel/image) scoped |
| No gradient extraction | Not addressed in POC |

### 4.2 Missing from color-cano-plan

| Gap | Impact |
|-----|--------|
| No acknowledgment of existing POC components | Risks duplicate work |
| No AEM EDS three-phase loading consideration | May violate performance requirements |
| No controller/state architecture specified | Components may not integrate with POC |
| No `ColorThemeController` mention | May create parallel state systems |
| No authoring guide | How do authors configure these blocks? |

### 4.3 Missing from color-PLG-plans

| Gap | Impact |
|-----|--------|
| No acknowledgment that POC already has pub/sub | Proposes reinventing the wheel |
| No implementation code | Pure architecture, no proof of concept |
| No AEM EDS awareness | Event bus may not work within Franklin constraints |
| No feature scope | What features does this architecture serve? |
| No migration path from existing `ColorThemeController` | How do we get from A to B? |
| No timeline or phases | When and how do we implement this? |

---

## 5. Sensibility Assessment

### 5.1 Are These Plans Sensible Given the POC?

**color-cano-plan:** 
- ⚠️ **Partially Sensible** — Good feature breakdown but needs reconciliation with existing components
- The ticket structure is valuable, but component names suggest building from scratch
- Recommendation: Map proposed components to existing POC components before starting

**color-PLG-plans:**
- ⚠️ **Conceptually Sound, Practically Redundant** — The architecture is clean but ignores existing patterns
- The POC's `ColorThemeController` already provides pub/sub via `subscribe()`
- The proposal to replace `controller.setBaseColor()` with `eventBus.publish()` adds indirection without clear benefit
- Recommendation: Evaluate if the refactoring cost is justified by measurable gains

### 5.2 What Should Be Adopted?

| Source | Adopt | Reason |
|--------|-------|--------|
| **Brad** | Gap analysis, backend services guide, authoring patterns | Proven in POC, reflects real constraints |
| **Brad** | AEM EDS three-phase loading rules | Critical for performance |
| **Cano** | Ticket breakdown structure | Useful for planning |
| **Cano** | Explore Palettes feature scope | Well-defined new feature |
| **PLG** | Event topic naming conventions | Cleaner than ad-hoc event names |
| **PLG** | Separation of presentation vs container | Good pattern for reusability |

---

## 6. Questions for Each Plan Author

### 6.1 Questions for Brad (color-brad-plans)

1. **Image Extraction Parity:** The POC uses simple pixel sampling. How do you envision porting the worker-based k-means clustering from legacy `ThreadPool.queueTask`?

2. **Component Completeness:** The gap report lists missing features (marker overlay, swatch CRUD, tint sliders). What's the prioritization for closing these gaps?

3. **Gradient & Accessibility Tools:** These tabs are mentioned in the gap report but not in the tracker. Are they in scope?

4. **CC Libraries Auth:** You mention auth/CORS concerns in migration gaps. Have you validated that browser-side calls work from Franklin pages, or do we definitely need Helix functions?

5. **Analytics Integration:** The POC dispatches `express:color-tools-action` events. Is there a bridge to Adobe Analytics already, or is that still TBD?

6. **Multi-Page Reuse:** The dev handoff mentions future variants (image-marquee, accessibility-marquee). How modular is the current ColorThemeController for these?

### 6.2 Questions for Cano (color-cano-plan)

1. **POC Awareness:** Did you review the existing `libs/color-components/` directory before proposing new components? Several of your proposed components (color-strip, action-button) have analogs.

2. **State Management:** Your plan doesn't mention `ColorThemeController`. How do your new components manage state? Do they integrate with the existing controller?

3. **AEM EDS Compliance:** Your plan doesn't address Franklin's three-phase loading. How do you ensure `palette-grid-container` doesn't block LCP with API calls?

4. **Shared vs Duplicate:** You propose `color-strip` as a shared component. The POC has `color-swatch-rail` and `ac-color-swatch`. Are these the same, or do we need both?

5. **Block Naming:** You suggest `palette` or `explore-palettes`. The POC uses `color-tools`. Are these separate blocks, or variants of one block?

6. **Search Integration:** You mention enhancing `search-marquee` to dispatch events to your grid. Has this been validated against the existing search-marquee implementation?

7. **API Endpoints:** You reference `/api/color/search`. Is this a hypothetical contract, or does this endpoint exist? Brad's backend-services.md has detailed proxy specs — have you aligned?

8. **Timeline Realism:** Your estimates show 18-22 days per feature. Is this for one developer? Does it account for AEM EDS constraints and code review cycles?

### 6.3 Questions for PLG (color-PLG-plans)

1. **Existing Pub/Sub:** The POC's `ColorThemeController` already has a `subscribe()` method that notifies listeners on state change. Why propose a new EventBus rather than extending this pattern?

2. **Migration Cost:** You propose replacing `controller.setBaseColor(hex)` with `eventBus.publish('user.intent.setBaseColor', { hex })`. What's the concrete benefit that justifies rewriting all component integrations?

3. **AEM EDS Awareness:** Your architecture doesn't mention Franklin's three-phase loading. How does the EventBus interact with Eager vs Lazy vs Delayed phases?

4. **Topic Explosion:** You define 10+ USER_INTENT topics and 4+ STATE_UPDATE topics. Is there a risk of over-engineering for the current feature set?

5. **No Implementation:** Your document says "It does not deeply focus on how the code will be implemented." Given that Brad's POC has working code, what does your architecture add that the POC doesn't already have?

6. **Container/Presentation Split:** You propose separating presentation components from containers. The POC's components like `<color-wheel>` receive a `controller` prop. How do you propose refactoring these without breaking existing integrations?

7. **Cross-Frame/Worker:** You mention events can be serialized for workers. Is there a concrete use case in Color Tools that requires this capability?

8. **Testability Claims:** You claim events improve testability. The POC already has snapshot tests for components. What testing patterns does your architecture enable that aren't possible today?

---

## 7. Recommendations

### 7.1 Immediate Actions

1. **Convene a Sync Meeting:** All three plan authors should review the POC code together
2. **Component Audit:** Create a mapping table of existing components → proposed components
3. **Establish Single Source of Truth:** Consolidate plans into one living document

### 7.2 Architecture Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| State management | Keep `ColorThemeController` vs. new EventBus | **Extend ColorThemeController** — it already works |
| Component naming | `color-tools` vs `palette` vs `explore-palettes` | **Use variant pattern** — `color-tools (explore)`, `color-tools (extract)` |
| Event patterns | Direct method calls vs pure events | **Hybrid** — events for cross-component, methods within controller |

### 7.3 Plan Consolidation

**Proposed Structure:**
1. Use Brad's documentation as foundation (it reflects real constraints)
2. Adopt Cano's ticket breakdown for Explore/Extract features
3. Apply PLG's naming conventions for event topics
4. Map all proposed components to existing POC components before building

---

## 8. Appendix: Side-by-Side Feature Comparison

### Existing POC Features

| Feature | Status | Location |
|---------|--------|----------|
| Color wheel canvas | ✅ Working | `color-wheel/index.js` |
| Harmony rule selection | ✅ Working | `color-harmony-toolbar/index.js` |
| Palette display | ✅ Working | `color-palette/index.js` |
| Swatch rail | ✅ Working | `color-swatch-rail/index.js` |
| State controller | ✅ Working | `ColorThemeController.js` |
| HarmonyEngine | ✅ Working | `utils/harmony/HarmonyEngine.js` |
| Image extraction (basic) | ✅ Working | `color-tools.js` (inline) |
| Tab routing | ✅ Working | `color-tools.js` |
| localStorage persistence | ✅ Working | `ColorThemeController.js` |
| Analytics events | ✅ Working | `ColorThemeController._trackAction()` |

### Proposed But Not Built

| Feature | Source | POC Analog | Needs Work |
|---------|--------|------------|------------|
| Explore Palettes grid | Cano | `color-palette-list` | API integration |
| Explore Palettes modal | Cano | None | New component |
| Extract Palette upload | Cano | `createImageExtractor()` | Formalize into component |
| Gradient extraction | Cano | None | New feature |
| EventBus | PLG | `ColorThemeController.subscribe()` | Already similar |
| ServiceOrchestrator | PLG | None | Depends on API availability |

---

## 9. Conclusion

The Color Tools project has **three competing visions** that need reconciliation:

1. **Brad's POC** is the most grounded in reality — it has working code and respects AEM EDS constraints
2. **Cano's plan** adds valuable feature scope (Explore/Extract) but risks building duplicate components
3. **PLG's plan** proposes architectural patterns that the POC already partially implements

**The path forward should:**
1. Start from the POC as the baseline
2. Add Explore/Extract features using existing component patterns
3. Apply clean architecture principles incrementally, not via big-bang refactor
4. Ensure all work respects AEM EDS three-phase loading

---

*Document created: January 5, 2026*  
*Review requested: Brad, Cano, PLG team*

