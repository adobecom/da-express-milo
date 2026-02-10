# Plan View — Simple (v2)

**Source of truth:** This doc is the local source of truth. Update here first; then sync to Jira and Planview/Confluence when ready.

**Timeline:** Feb 9 – Mar 23, 2026. **Scope:** MVP; Shared UI Phase 1.

**PLG → team member:** PLG 1 = **Vineet Sharma** · PLG 2 = **Dhananjay Singh Kanwar**. *(Jira summaries may still say "PLG 1" / "PLG 2"; Assignee column = actual Jira assignee.)*

**Full map below** = Jira data with **Instructions applied** (defer 3, add 2 to Shared UI, move 5 to correct epics). Stories only, no subtasks. Each epic: LOE and Assignee, sorted by assignee; then cumulative hrs/days and dev hrs.

**Shared UI & Floating Toolbar:**
- **Base branch for all Shared UI components:** `color`. New Shared UI work should branch from `color`.
- **Floating Toolbar** is its own reusable component. The **page orchestrates** where it appears: either **inside a modal** (e.g. palette/gradient detail in Explore) or as a **sticky** bar. **Not all modals have a toolbar** — e.g. Harmony (Color Wheel) and Contrast Checker modals do not; only the contexts that need Copy HEX, Share, Download, Save to CC Libraries, etc. use it. The toolbar does not own the modal; the page decides whether to show it (modal vs sticky) or omit it.

---

## Instructions

### 1. Defer (out of plan)

Clear **Epic Link** on these **3** so they drop out of Plan View:

| Key | Summary |
|-----|---------|
| [MWPW-186677](https://jira.corp.adobe.com/browse/MWPW-186677) | [Color Wheel] Build Color Harmony Modal |
| [MWPW-186676](https://jira.corp.adobe.com/browse/MWPW-186676) | [SHARED] Color Bento Component |
| [MWPW-185799](https://jira.corp.adobe.com/browse/MWPW-185799) | [EXPLORE] Explore Carousel |

---

### 2. Shared UI ([MWPW-187374](https://jira.corp.adobe.com/browse/MWPW-187374))

**Add to Plan View:**

| Key | Summary | LOE | Action |
|-----|---------|-----|--------|
| [MWPW-187630](https://jira.corp.adobe.com/browse/MWPW-187630) | [COLOR] [SHARED] Color Edit (Phase 1) | 22h | Set Epic Link = [MWPW-187374](https://jira.corp.adobe.com/browse/MWPW-187374) |
| [MWPW-187682](https://jira.corp.adobe.com/browse/MWPW-187682) | [COLOR] [SHARED] Palette Strips – all variants (components only) | 18–28h | Set Epic Link = [MWPW-187374](https://jira.corp.adobe.com/browse/MWPW-187374) |

**Move out** (set Epic Link in Jira so they appear under the correct epic):

| Key | Summary | Set Epic Link to |
|-----|---------|------------------|
| [MWPW-186594](https://jira.corp.adobe.com/browse/MWPW-186594) | [PICKER] Spectrum Web Components | [MWPW-184634](https://jira.corp.adobe.com/browse/MWPW-184634) (Explore) |
| [MWPW-187378](https://jira.corp.adobe.com/browse/MWPW-187378) | Renderers (Gradients, Extract) | [MWPW-184634](https://jira.corp.adobe.com/browse/MWPW-184634) (Explore). *Gradient epic if it exists; else Explore.* |
| [MWPW-187381](https://jira.corp.adobe.com/browse/MWPW-187381) | Load More | [MWPW-184634](https://jira.corp.adobe.com/browse/MWPW-184634) (Explore) |
| [MWPW-187384](https://jira.corp.adobe.com/browse/MWPW-187384) | Results Filter | [MWPW-184634](https://jira.corp.adobe.com/browse/MWPW-184634) (Explore) |
| [MWPW-186947](https://jira.corp.adobe.com/browse/MWPW-186947) | Loading Screen | [MWPW-184634](https://jira.corp.adobe.com/browse/MWPW-184634) (Explore) |
| [MWPW-187383](https://jira.corp.adobe.com/browse/MWPW-187383) | Image Upload Component | [MWPW-185872](https://jira.corp.adobe.com/browse/MWPW-185872) (Extract) |
| [MWPW-187410](https://jira.corp.adobe.com/browse/MWPW-187410) | Color Blindness Strip Renderer | [MWPW-186751](https://jira.corp.adobe.com/browse/MWPW-186751) (Color Blindness) |
| [MWPW-187376](https://jira.corp.adobe.com/browse/MWPW-187376) | Modal (Contrast variant) | [MWPW-186710](https://jira.corp.adobe.com/browse/MWPW-186710) (Contrast Checker) |

---

### 3. Modal structure & [MWPW-185800](https://jira.corp.adobe.com/browse/MWPW-185800) subtask moves

**Modals in plan:**

| Scope | Ticket / story | Notes |
|-------|----------------|-------|
| **Shell / container (Shared UI)** | [MWPW-185800](https://jira.corp.adobe.com/browse/MWPW-185800) | Modal/Drawer System — shell only (container, responsive, a11y). *Epic Link was moved from Explore (MWPW-184634) to Shared UI (MWPW-187374): foundational modal infrastructure used across all 5 Color Explorer pages (Explore Palette/Gradient, Extract, Color Wheel Harmony, Contrast Checker, Color Blindness).* |
| **Explore Modal (Palette + Gradient)** | [MWPW-186946](https://jira.corp.adobe.com/browse/MWPW-186946) | [INTEGRATION] Modal Integration (Gradient & Palette Cards) — Explore page. |
| **Contrast Checker Modal** | [MWPW-187376](https://jira.corp.adobe.com/browse/MWPW-187376) | Modal (Contrast variant) — Contrast epic. |
| **Color Wheel Modal** | [MWPW-186677](https://jira.corp.adobe.com/browse/MWPW-186677) | **Deferred** (out of plan). |

**Subtasks of 185800 that don’t belong there (move in Jira when ready):**

| Subtask | Summary | Move to |
|---------|---------|--------|
| [MWPW-186964](https://jira.corp.adobe.com/browse/MWPW-186964) | Integration with Palette Content | Explore (page-level). **Already covered by** [MWPW-186946](https://jira.corp.adobe.com/browse/MWPW-186946) Modal Integration (Gradient & Palette Cards). |
| [MWPW-186965](https://jira.corp.adobe.com/browse/MWPW-186965) | Integration with Gradient Content | Explore (page-level). **Already covered by** [MWPW-186946](https://jira.corp.adobe.com/browse/MWPW-186946) Modal Integration (Gradient & Palette Cards). |
| [MWPW-186967](https://jira.corp.adobe.com/browse/MWPW-186967) | Login Flow Integration | **Closed as duplicate** of [MWPW-187083](https://jira.corp.adobe.com/browse/MWPW-187083) (Floating Toolbar – Save to CC Libraries). |

**Answer:** [MWPW-186964](https://jira.corp.adobe.com/browse/MWPW-186964) and [MWPW-186965](https://jira.corp.adobe.com/browse/MWPW-186965) are already covered by the **Explore integration** story [MWPW-186946](https://jira.corp.adobe.com/browse/MWPW-186946) (Modal Integration – Gradient & Palette Cards) and by the broader [MWPW-187456](https://jira.corp.adobe.com/browse/MWPW-187456) (Shared UI Components Integration – Explore). They are page-level work; 186946 is the Explore ticket that does that wiring.

**Done in Jira:** 186964 and 186965 were closed as *Done* with comment "Duplicate — scope covered by MWPW-186946 (Explore Modal Integration)." [MWPW-185800](https://jira.corp.adobe.com/browse/MWPW-185800) description was updated to *Shell / container only*: in scope = container (desktop modal, mobile drawer), responsive behavior, state management, a11y, gestures; out of scope = Palette/Gradient content, Login flow (→ 186946, 187074). 186967 closed as duplicate of 187083 (Toolbar – CC Libraries).

**Pending Jira update (do not apply yet):** [MWPW-185800](https://jira.corp.adobe.com/browse/MWPW-185800) — set **Original estimate = 24h**, **Remaining estimate = 16h** (shell only after moving out integration subtasks). *Local doc already updated; sync to Jira and Planview/Confluence when ready.*

---

## Full map by epic (after applying Instructions)

Order: **Shared UI → Explore → Extract → Color Wheel → Contrast → Color Blindness.** Stories sorted by Assignee then Key. **Deferred** (186677, 186676, 185799) are not listed. **Move-out** tickets appear under their target epic. 8h = 1d.

---

### Shared UI [MWPW-187374](https://jira.corp.adobe.com/browse/MWPW-187374)

*After Instructions: 186676 deferred (removed). 186594, 187378, 187381, 187384, 186947 → Explore (187378 = Gradient epic if exists, else Explore); 187383 → Extract; 187410 → Color Blindness; 187376 → Contrast. 187630, 187682 added to Plan View.*

| Key | Summary | LOE | Assignee |
|-----|---------|-----|----------|
| [MWPW-185805](https://jira.corp.adobe.com/browse/MWPW-185805) | [COLOR] [SHARED] Spectrum Web Components Setup - Brad | 17h | Brad Johnson |
| [MWPW-187491](https://jira.corp.adobe.com/browse/MWPW-187491) | [COLOR] [SHARED] Infrastructure - Analytics, API Utilities - Brad | 4h | Brad Johnson |
| [MWPW-187630](https://jira.corp.adobe.com/browse/MWPW-187630) | [COLOR] [SHARED] Color Edit (Phase 1) | 22h | Vineet Sharma |
| [MWPW-185800](https://jira.corp.adobe.com/browse/MWPW-185800) | [COLOR] [SHARED] Modal/Drawer System (Palette and Gradient) | 24h (16h remaining) | Yeiber Cano |
| [MWPW-186819](https://jira.corp.adobe.com/browse/MWPW-186819) | [COLOR] [EXPLORE] Banner (Cool Dark Variant) - Vineet Sharma | 6h | Vineet Sharma |
| [MWPW-187074](https://jira.corp.adobe.com/browse/MWPW-187074) | [COLOR] [EXPLORE] - Floating Toolbar Component | 26h remaining | Dhananjay Singh Kanwar |
| [MWPW-187455](https://jira.corp.adobe.com/browse/MWPW-187455) | [COLOR] [SHARED] Authentication Service - Dhananjay Singh Kanwar | 15h | Dhananjay Singh Kanwar |
| [MWPW-187682](https://jira.corp.adobe.com/browse/MWPW-187682) | [COLOR] [SHARED] Palette Strips – all variants (components only) | 18–28h | Yeiber Cano |

**Cumulative:** 114h + (18–28h) ≈ **132–142h (16.5–17.8 d)**. **Dev hrs:** Brad 21h · Vineet 28h · Dhananjay 41h · Yeiber 42–52h.

---

### Explore [MWPW-184634](https://jira.corp.adobe.com/browse/MWPW-184634)

*After Instructions: 185799 deferred (removed). 186594, 187378, 187381, 187384, 186947 moved in from Shared UI (187378 = Renderers/Gradient → Explore when no Gradient epic).*

| Key | Summary | LOE | Assignee |
|-----|---------|-----|----------|
| [MWPW-185797](https://jira.corp.adobe.com/browse/MWPW-185797) | [PLG] [COLOR] [EXPLORE] - Marquee - Vineet Sharma | — | Dhananjay Singh Kanwar |
| [MWPW-185798](https://jira.corp.adobe.com/browse/MWPW-185798) | [COLOR] [EXPLORE] - Results List - Yeiber | 10h | Yeiber Cano |
| [MWPW-185802](https://jira.corp.adobe.com/browse/MWPW-185802) | [COLOR] [EXPLORE] - Color Palette - Yeiber | 30h | Yeiber Cano |
| [MWPW-185804](https://jira.corp.adobe.com/browse/MWPW-185804) | [COLOR] [EXPLORE]: Color Gradient Component - Yeiber | 30h | Yeiber Cano |
| [MWPW-186594](https://jira.corp.adobe.com/browse/MWPW-186594) | [COLOR] [PICKER] Spectrum Web Components - Brad | 15h | Yeiber Cano |
| [MWPW-187378](https://jira.corp.adobe.com/browse/MWPW-187378) | [COLOR] [SHARED] Renderers (Gradients, Extract) | 16h | Yeiber Cano |
| [MWPW-186943](https://jira.corp.adobe.com/browse/MWPW-186943) | [COLOR] [EXPLORE] [INTEGRATION] - Loading Screen Component - Yeiber | 10h | Yeiber Cano |
| [MWPW-186944](https://jira.corp.adobe.com/browse/MWPW-186944) | [COLOR] [EXPLORE] [INTEGRATION] - API Integration (Page Load) - Yeiber | 15h | Yeiber Cano |
| [MWPW-186945](https://jira.corp.adobe.com/browse/MWPW-186945) | [COLOR] [EXPLORE] [INTEGRATION] - Search Integration (PLG Marquee) - Yeiber | 5h | Yeiber Cano |
| [MWPW-186946](https://jira.corp.adobe.com/browse/MWPW-186946) | [COLOR] [EXPLORE] [INTEGRATION] - Modal Integration (Gradient & Palette Cards) - Yeiber | 15h | Yeiber Cano |
| [MWPW-186947](https://jira.corp.adobe.com/browse/MWPW-186947) | Loading Screen | 12h | Yeiber Cano |
| [MWPW-187381](https://jira.corp.adobe.com/browse/MWPW-187381) | Load More | 16h | Yeiber Cano |
| [MWPW-187384](https://jira.corp.adobe.com/browse/MWPW-187384) | Results Filter | 16h | Yeiber Cano |
| [MWPW-187437](https://jira.corp.adobe.com/browse/MWPW-187437) | Integrate Shared UI Components - Explore | — | Yeiber Cano |
| [MWPW-187456](https://jira.corp.adobe.com/browse/MWPW-187456) | [COLOR] [EXPLORE] [INTEGRATION] - Shared UI Components Integration | 52h | Yeiber Cano |
| [MWPW-187556](https://jira.corp.adobe.com/browse/MWPW-187556) | [COLOR] [EXPLORE] Accessibility (a11y) | 10h | Yeiber Cano |

**Cumulative:** 252h (31.5 d) + TBD (2 stories). **Dev hrs:** Dhananjay — · Yeiber 252h + TBD.

---

### Extract [MWPW-185872](https://jira.corp.adobe.com/browse/MWPW-185872)

*After Instructions: 187383 moved in from Shared UI (Image Upload Component).*

| Key | Summary | LOE | Assignee |
|-----|---------|-----|----------|
| [MWPW-186590](https://jira.corp.adobe.com/browse/MWPW-186590) | [COLOR] [Extract] - Upload Marquee block - Brad | 20h | Brad Johnson |
| [MWPW-186598](https://jira.corp.adobe.com/browse/MWPW-186598) | [COLOR] [Extract] - Result Block (Palette + Gradient, incl. Color Strip & Floating Toolbar) - Brad | 20h | Brad Johnson |
| [MWPW-187408](https://jira.corp.adobe.com/browse/MWPW-187408) | [COLOR] [Extract] [INTEGRATION] - Shared UI Components Integration - Brad | 24h | Yeiber Cano |
| [MWPW-187383](https://jira.corp.adobe.com/browse/MWPW-187383) | Image Upload Component | 15h | Yeiber Cano |
| [MWPW-187453](https://jira.corp.adobe.com/browse/MWPW-187453) | [COLOR] [Extract] - Accessibility & Keyboard Navigation Implementation - Brad | 16h | — |

**Cumulative:** 95h (11.9 d). **Dev hrs:** Brad 40h · Yeiber 39h · Unassigned 16h.

---

### Color Wheel [MWPW-186674](https://jira.corp.adobe.com/browse/MWPW-186674)

*After Instructions: 186677 deferred (removed).*

| Key | Summary | LOE | Assignee |
|-----|---------|-----|----------|
| [MWPW-186675](https://jira.corp.adobe.com/browse/MWPW-186675) | [COLOR] [Color Wheel] - Palette builder Block - Vineet Sharma | 24h | Abhinav Chauhan |
| [MWPW-187451](https://jira.corp.adobe.com/browse/MWPW-187451) | [COLOR] [Color Wheel] [INTEGRATION] - Shared UI Components Integration - Dhananjay Singh Kanwar | 15h | Yeiber Cano |
| [MWPW-187452](https://jira.corp.adobe.com/browse/MWPW-187452) | [COLOR] [Color Wheel] - Accessibility & Keyboard Navigation - Vineet Sharma | 12h | Yeiber Cano |

**Cumulative:** 51h (6.4 d). **Dev hrs:** Abhinav 24h · Yeiber 27h.

---

### Contrast Checker [MWPW-186710](https://jira.corp.adobe.com/browse/MWPW-186710)

*After Instructions: 187376 moved in from Shared UI (Modal Contrast variant).*

| Key | Summary | LOE | Assignee |
|-----|---------|-----|----------|
| [MWPW-186753](https://jira.corp.adobe.com/browse/MWPW-186753) | [COLOR] [Contrast Checker] - Contrast Checker Tool - Vineet Sharma | 20h | Abhinav Chauhan |
| [MWPW-187357](https://jira.corp.adobe.com/browse/MWPW-187357) | [COLOR] [Contrast Checker]: Integrate Shared UI Components - Contrast Checker - Vineet Sharma | 20h | Yeiber Cano |
| [MWPW-187376](https://jira.corp.adobe.com/browse/MWPW-187376) | Modal (Contrast variant) | 8h | Yeiber Cano |
| [MWPW-187412](https://jira.corp.adobe.com/browse/MWPW-187412) | [COLOR] [Contrast Checker] - Contrast Modal Accessibility - Vineet Sharma | 12h | Yeiber Cano |
| [MWPW-187413](https://jira.corp.adobe.com/browse/MWPW-187413) | [COLOR] [Contrast Checker] - Contrast Checker Tool Accessibility - Vineet Sharma | 25h | — |

**Cumulative:** 85h (10.6 d). **Dev hrs:** Abhinav 20h · Yeiber 40h · Unassigned 25h.

---

### Color Blindness [MWPW-186751](https://jira.corp.adobe.com/browse/MWPW-186751)

*After Instructions: 187410 moved in from Shared UI (Color Blindness Strip Renderer).*

| Key | Summary | LOE | Assignee |
|-----|---------|-----|----------|
| [MWPW-186754](https://jira.corp.adobe.com/browse/MWPW-186754) | [COLOR] [Color Blindness Checker] - Color Conflicts - Dhananjay Singh Kanwar | 8h | Abhinav Chauhan |
| [MWPW-186755](https://jira.corp.adobe.com/browse/MWPW-186755) | [COLOR] [Color Blindness Checker] - Color Strip Container | — | Abhinav Chauhan |
| [MWPW-187410](https://jira.corp.adobe.com/browse/MWPW-187410) | Color Blindness Strip Renderer | 24h | Yeiber Cano |
| [MWPW-187411](https://jira.corp.adobe.com/browse/MWPW-187411) | [COLOR] [Color Blindness] - Color Wheel Integration - Dhananjay Singh Kanwar | 16h | Abhinav Chauhan |
| [MWPW-187358](https://jira.corp.adobe.com/browse/MWPW-187358) | [COLOR] [Color Blindness Checker] - Integrate Shared UI Components - Color Blindness Simulator - Dhananjay Singh Kanwar | 24h | Yeiber Cano |
| [MWPW-187409](https://jira.corp.adobe.com/browse/MWPW-187409) | [COLOR] [Color Blindness] - Sidebar Filters & Controls - Dhananjay Singh Kanwar | 16h | Yeiber Cano |
| [MWPW-187557](https://jira.corp.adobe.com/browse/MWPW-187557) | [COLOR] [Color Blindness] - A11y | 10h | — |

**Cumulative:** 98h (12.3 d) + TBD (1 story). **Dev hrs:** Abhinav 24h + TBD · Yeiber 64h · Unassigned 10h.

---

*Map = Jira data with Instructions applied (doc only). Deferred: 186677, 186676, 185799. 8h = 1d. Instructions at top.*
