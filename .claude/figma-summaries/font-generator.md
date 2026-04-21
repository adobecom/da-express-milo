# Figma Summary — Font Generator
Source: https://www.figma.com/design/6h3Jy13fi4HYyxQkcRbYDe/shairilk-font-generator?t=YAXYs1ZJnkUfKZzL-0
Fetched: 2026-04-20

## Page Overview
| Node ID | Name | Role | Description |
|---|---|---|---|
| 2:28556 | Font Generator Page | design_frame (section) | Full page layout — multiple viewport widths + mobile variants, complete page from hero through footer |
| 2:28957 | Loading screens | design_frame (section) | Loading/skeleton state of the font generator at 1920px, 1440px, 899px, and 375px (mobile) |
| 2:29120 | Components | reference_screenshot | Figma component library — individual UI atoms (font cards, filter panels, etc.) — do not rebuild |
| 2:31537 | Editable content-visuals | reference_screenshot | Standalone visual assets: "New Post" style mockup, font preview grid, phone mockup + font picker UI |
| 2:32236 | Unicode generator - W | design_frame | Full desktop page (1920px) — primary build target, complete page from nav to footer |
| 2:33451 | Unicode generator - W | design_frame | Alternate desktop variant (same 1920px layout, slight content variation) |
| 2:34360 | Unicode generator - W | design_frame | Third desktop variant (green-tinted theme, same structure) |
| 2:34297 | How-to | reference_screenshot | Standalone How-to section visual — individual block asset |
| 2:34326 | Text-field | reference_screenshot | Standalone text input field component closeup |
| 2:35095–2:35450 | action-ads / action-social-media / action-games / action-design / action-messaging / action-documents | reference_screenshot | Individual bento-card image assets for "See your unicode font in action" section |
| 2:37274–2:37323 | More-fonts | reference_screenshot | Font preview grid tiles (Bacalar, Bogart, RINGOLD, Gardez, Swear Display, P22 Civilite, Aboreto) |
| 2:37340–2:37529 | How-to | reference_screenshot | How-to step visual tiles (steps 1–4) |
| 2:37592–2:37595 | AdobeStock_1377097642 | reference_screenshot | Stock photo assets (pasted reference images) |

---

## Frames to Build

### Unicode generator - W — Desktop Full Page (node 2:32236)
**Role:** design_frame
**Platform:** desktop (1920px wide, max-width 1600px content)

**Visible text content:**
- Adobe Express (nav logo + wordmark)
- "Free unicode font generator." (H1 — black/dark hero background)
- "Create eye-catching text styles you can copy and paste anywhere. Then bring your style into Adobe Express to design social posts, emails, and handles effortlessly." (hero body copy)
- "Looking for more fonts?" + "Get Adobe Express Free" (sticky promo in left panel)
- "Categories" (filter accordion label)
- "Languages" (filter accordion label)
- Category filter pills: 𝓐𝓵𝓵 (All), 🅟🅞🅟🅤🅛🅐🅡 (Popular), ⓒⓞⓞⓛ (Cool), ƒαɳ૮ყ (Fancy), ̶G̶l̶i̶t̶c̶h̶ (Glitch), ❚█══Symbol══█❚ (Symbol)
- "How the unicode font generator works." (section heading)
- "1. Find your unicode font." (how-to step 1)
- "2. Edit and copy text." (how-to step 2)
- "3. Paste anywhere online." (how-to step 3)
- "4. Take your unicode font further in Adobe Express." (how-to step 4)
- How-to body: "Lorem ipsum dolor sit amet consectetur. Diam tortor magna lectus leo maecenas consectetur potenti pretium amet. Semper in blandit ultrices at etiam in facilisis." (placeholder — final copy TBD)
- "Looking for more fonts?" (font bento section heading)
- "Design with style" (CTA inside text input field — button)
- "🅝🅔🅦 🅟🅞🅢🅣" (sample text shown in text field preview)
- Font names visible in "More-fonts" grid: Bacalar, Bogart, RINGOLD, Gardez, Swear Display, P22 Civilite, Aboreto
- "Looking for more fonts?" (footer banner)
- "Get Adobe Express Free" (footer CTA button, dark fill)
- "Questions? We have answers." (FAQ section heading)
- "See what people are saying about Adobe Express." (Testimonials heading)
- "Add your text everywhere Unicode is supported." (icon carousel heading)

**Interactive controls:**
| Control | Type | Default state | Notes |
|---|---|---|---|
| Text input field (left side panel) | textarea (large) | Empty / skeleton shimmer gradient | Main entry point — user types text, font previews update in real-time in card grid |
| Categories accordion | collapsible accordion | Expanded, showing 3×2 grid of category pills | 6 pills: All, Popular, Cool, Fancy, Glitch, Symbol |
| Languages accordion | collapsible accordion | Collapsed | Hidden list of language filters |
| Font category selector pills | toggle button | "Popular" selected (blue border #3b63fb), "All" unselected | Selected state: white bg + blue 0.941px border + blue highlight; unselected: white bg no border |
| List/Grid view toggle | icon button group | Two skeleton icon buttons (32×32px rounded-[8px]) | Switches font card display mode |
| Font cards (12 visible at load, 3-col grid desktop) | card with CTA button | Skeleton loading state (gray gradient shimmer) | After load: shows font name + sample text rendered in that font; CTA = "Use this font" or similar |
| "Load more" / pagination button | pending button | Loading spinner (circle progress, black bg, 120px wide) | Centered below card grid |
| "Design with style" button (inside text field) | primary button static-black | — | Opens design in Adobe Express; uses S2_Icon_OpenIn_20_N |
| Copy icon (inside text field) | icon button | — | Copies generated unicode text; uses S2_Icon_Copy_20_N |
| "Get Adobe Express Free" sticky promo button | CTA button black | — | Fixed in left panel; links to Express sign-up |
| How-to step cards | accordion/tab (clickable rows) | Step 1 active (gradient pink-orange left bar), steps 2–4 inactive (gray left bar) | Clicking step changes left visual panel |
| FAQ accordion items | expandable rows | All collapsed | Multiple FAQ entries |

**Layout:**
- Two-column layout for the main generator: sticky left side panel (477px wide, position: sticky top:0) + scrollable right card container (flex-1, max-width ~1120px remaining)
- Left panel contains: text input field (200px tall card, shadow, rounded-[16px]) + filter panel (Categories + Languages accordions) + sticky promo (rounded-[16px], white bg)
- Right panel: filter bar row at top (list/grid toggle left, count text right) + 3-column grid of font cards (gap 8px) + "load more" button
- Section padding: 40px sides (grid/container-padding-side), 80px vertical (section-padding/xl)
- Content max-width: 1600px, centered
- Background of font generator section: `var(--gray/75, #f3f3f3)`
- Hero (transparent-img-marquee): black background, full-width, 525px tall; text left, hero image right

**Colors:**
- Hero background: `#000000` (black)
- Page/section background: `var(--gray/75, #F3F3F3)`
- Font generator side panel background: `#f3f3f3`
- Font card background: `#FFFFFF` (white)
- Font card skeleton gradient: from `#f8f8f8` via `#e6e6e6` to `#f8f8f8`
- Category pill selected border: `var(--s2ac/palette/blue/900, #3b63fb)`
- Sticky promo background: `white`
- Sticky promo button (Get Adobe Express Free): `rgba(0,0,0,0.84)` fill, white text
- Text field shimmer gradient: from `rgb(218,218,218)` via `rgb(198,198,198)` to `rgb(218,218,218)`
- How-to section background: `#FFFFFF`
- How-to section magenta card bg: `var(--magenta/1100, #a3053e)`
- Active step indicator: gradient `rgb(255, 72, 133)` to `rgb(252, 125, 0)` (pink to orange)
- Inactive step indicator: gray `rgb(143, 143, 143)` with frosted border
- "Design with style" button: `rgba(0,0,0,0.84)` fill, white text
- Body text color: `var(--alias/content/typography/body, #505050)`
- Heading text color: `var(--content/neutral/default, #222)`
- Banner footer background: dark/black

**Typography:**
- H1 hero: Adobe Clean Spectrum VF Black (font-weight 900), size `var(--global/typography/size/headings/heading-2xl, 45px)` desktop / 32px mobile, line-height 1.04
- Hero body: Adobe Clean Spectrum VF Regular (400), size `var(--global/typography/size/body/body-s, 16px)` desktop / 14px mobile, line-height 1.3
- Section headings (H2): Adobe Clean Spectrum VF Black (900), size `var(--typography/headings/xl, 36px)`, line-height 1.04
- How-to step titles: Adobe Clean Spectrum VF Bold (700), size `var(--typography/title/m, 22px)`, line-height 28px
- How-to body: Adobe Clean Spectrum VF Regular (400), size `var(--typography/body/s, 16px)`, line-height 1.3
- Filter category accordion label: Adobe Clean Spectrum VF Bold (700), size `var(--font-size/100, 14px)`, line-height 18px
- Sticky promo label: Adobe Clean Spectrum VF Bold (700), size 14px (label-m)
- Sticky promo CTA: Adobe Clean Spectrum VF Bold (700), size 18px, white
- Font category pill text: Adobe Clean Spectrum VF Bold (700), size ~17.7px (label-2xl) — displays unicode characters

**Designer annotations:** None outside frames; all design intent expressed through layer names and component structure.

**Journey phases covered:** Upload / entry point (text input) | Loading / processing (skeleton state in loading section) | Success / copy-paste flow

**Component names from layer tree:**
- `transparent-img-marquee` — hero section with black bg and photo
- `Font-generator` — the main 2-col generator UI (side panel + card grid)
- `font-generator-side-panel` — left sticky panel
- `font-generator-card-container` — right scrollable card area
- `Filter-panel-atoms` — contains Categories-accordian + Languages-accordian
- `Categories-accordian` / `Languages-accordian` — accordion items
- `Font-category-selector` — individual category pill
- `sticky-promo` — "Looking for more fonts?" promo bar in left panel
- `Filter-bar` — top bar in card grid area (list/grid toggle + count)
- `Card-container` — 3-column font card grid (desktop) / 1-column (mobile)
- `Font-card-1` through `Font-card-12` — individual font preview cards
- `text-field` — the main user text input
- `Columns-Variables` — "Looking for more fonts?" bento section (river flow layout)
- `More-fonts` — font name grid display
- `how-to-v2` — 4-step how-to section
- `Font-bento` — 6-card bento grid (action use cases)
- `Testimonials Block` — testimonials carousel
- `FAQ-accordian` — FAQ section
- `Banner-cool-variables` — bottom CTA banner
- `Global footer` — site footer
- `icon-carousel` — "Add your text everywhere" platform icon marquee
- `way finding/navigation` — top nav component

---

### Loading Screens — Desktop 1920px (node 2:29014, inside section 2:28957)
**Role:** design_frame
**Platform:** desktop (1920px)

**Visible text content:**
- Adobe Express wordmark (nav)
- "Free unicode font generator." (hero H1)
- "Create eye-catching text styles you can copy and paste anywhere. Then bring your style into Adobe Express to design social posts, emails, and handles effortlessly." (hero body)
- No font card text — all skeleton placeholders

**Interactive controls:**
| Control | Type | Default state | Notes |
|---|---|---|---|
| Text input | textarea | Skeleton shimmer gradient (gray gradient animating) | Not yet interactive |
| Categories accordion | collapsible | Open — 6 skeleton pills (gray gradients) | 3x2 grid of skeleton placeholders |
| Languages accordion | collapsible | Closed label visible | No content yet |
| Font cards (12, 3-col) | skeleton card | Gradient shimmer placeholder (h=304px each) | Upper area: large gradient block; lower CTA: skeleton text + pending button |
| Pending CTA buttons | loading button | `ButtonPendingStaticBlack` — `rgba(0,0,0,0.09)` bg + progress circle spinner | 157px wide, 16px radius |
| Load more button | pending button | Extra-large spinner, 120px wide, `rgba(0,0,0,0.09)` bg | |
| Filter bar | loading | Skeleton text for view count + 2 skeleton icon buttons | |

**Layout:** Same 2-column layout as loaded state. Sticky left panel (477px) + 3-col card grid. Background: `#f3f3f3`.

**Colors:**
- Skeleton gradient (cards and pills): from `var(--palette/gray/100, #f8f8f8)` via `var(--palette/gray/200, #e6e6e6)` to `#f8f8f8`
- Category pill skeleton gradient: from `var(--s2ac/palette/gray/300, #dadada)` via `var(--s2ac/palette/gray/400, #c6c6c6)` to `#dadada`
- Pending button: `rgba(0,0,0,0.09)` with circular progress indicator

**Journey phases covered:** Loading / processing (skeleton state)

---

### Loading Screens — Mobile 375px (node 2:28958, inside section 2:28957)
**Role:** platform_variant
**Platform:** mobile (375px)

**Visible text content:**
- "Adobe Express" local nav label (sticky top bar, "Adobe Express" title + chevron)
- Adobe wordmark in top nav
- "Sign In" button in nav
- "Free unicode font generator." (hero H1, 32px)
- "Create eye-catching text styles you can copy and paste anywhere. Then bring your style into Adobe Express to design social posts, emails, and handles effortlessly." (hero body, 14px)
- No filter panel shown in mobile loading state (simplified)

**Interactive controls:**
| Control | Type | Default state | Notes |
|---|---|---|---|
| Text input | textarea | Skeleton shimmer gradient | |
| Font cards (12, 1-col) | skeleton card | Same skeleton pattern, taller gradient block (62px) | Single column layout |
| Pending CTA buttons | `ButtonPendingStaticBlack` | Same as desktop | 157px wide |
| Filter bar | simplified | Skeleton count text left + pending button right (93px) | No list/grid icon group |

**Layout:** Single-column stacked layout. No side panel — filter is hidden. Cards stack vertically. Container padding: 16px sides. Font generator bg: `#f3f3f3`.

**Specific mobile nav elements:**
- Top nav: `#f8f8f8` bg, "Adobe" wordmark, hamburger menu icon (`SX_ShowMenu_18_N`), App launcher icon, "Sign In" secondary button
- Local nav (sticky below top nav): `#f8f8f8` bg, "Adobe Express" title (Bold 16px), chevron down icon (`SX_ChevronDown_18_N`), box-shadow: `0 4px 16px rgba(0,0,0,0.16)`

---

### Font Generator Page Section — Mobile Filter Panel Variants (within node 2:28556)
**Role:** platform_variant
**Platform:** mobile (375px) + tablet (899px)

**Child frames include:**
- `Unicode filters - M` (node 2:28557) — 375px, 900px viewport showing filter panel overlay state
- Multiple variants of the mobile generator page
- `Mobile filter-Unicode` (node 2:28567 + 2:28580) — filter panel open state (font-filters-panel, 330px wide, 430–900px tall)

**Key mobile-specific components:**
- `font-filters-panel` instance (330px wide) — filter drawer/overlay
- No persistent left panel; filters accessed via button
- Mobile filter button in Filter-bar triggers the overlay panel

---

### How-to Section (node 2:32320)
**Role:** design_frame (sub-section)
**Platform:** desktop

**Visible text content:**
- "How the unicode font generator works." (H2)
- Step 1: "1. Find your unicode font." + body copy (lorem ipsum placeholder — final copy TBD)
- Step 2: "2. Edit and copy text."
- Step 3: "3. Paste anywhere online."
- Step 4: "4. Take your unicode font further in Adobe Express."

**Interactive controls:**
| Control | Type | Default state | Notes |
|---|---|---|---|
| How-to steps (4) | clickable accordion rows | Step 1 expanded/active | Left colored bar indicator — active = pink-orange gradient, inactive = gray |
| Step visual (left panel) | dynamic visual | Shows phone mockup with unicode text on magenta (#a3053e) bg | Changes as user clicks steps |
| "Design with style" button | CTA inside visual | Primary static-black button | Opens Adobe Express; `S2_Icon_OpenIn_20_N` icon |
| Font category pills (in visual) | static display | Shows: All, Popular (selected, blue border), Cool, Fancy, Glitch, Symbol | Decorative in context, interactive in main panel |

**Layout:** Two-column. Left: rounded-[16px] magenta card (740x416px) with phone mockup + floating text field widget + filter pill panel. Right: 4 step-content cards (flex-col, gap 16px). White background. Padding 80px vertical, 40px horizontal.

---

## Reference Frames — Do Not Build

### Components (node 2:29120)
**Depicts:** The full Figma component library for the font generator feature — individual UI atoms: font cards (loaded + skeleton), filter panels, font category selectors, text fields, how-to cards, promo components, and their variants across breakpoints.
**Relevance:** Designer's component inventory. Defines exact visual appearance of each component in isolation. Use as reference when implementing individual components, not as a page to build.

### Editable content-visuals (node 2:31537)
**Depicts:** Standalone visual assets used across the page: the "New Post" social post mockup with unicode text, the font name preview grid (Bacalar, Bogart, etc.), and a phone mockup with font picker UI.
**Relevance:** These are image/asset content designed to be placed into the page sections. The "More-fonts" visual is used in the `Columns-Variables` block; the social mockup is used in `transparent-img-marquee` and `Font-bento` cards.

### Action bento cards (nodes 2:35095 to 2:36820)
**Depicts:** Individual image assets for the "See your unicode font in action" bento grid (Font-bento section). Categories: ads, social media, games, design, messaging, documents.
**Relevance:** Visual content / imagery for the 6 bento cards. Not UI components to rebuild — these are final visual assets.

### More-fonts tiles (nodes 2:37274 to 2:37323)
**Depicts:** Individual 656x656px font showcase tiles showing font names in their own typefaces.
**Relevance:** Media assets for the Columns-Variables (river flow) section.

### How-to visual tiles (nodes 2:37340 to 2:37529)
**Depicts:** 604x340px visual assets for how-to steps 1–4.
**Relevance:** Image content for the how-to section's left panel visuals.

### Stock photo assets (nodes 2:37592 to 2:37595)
**Depicts:** AdobeStock photos used as reference or content imagery.
**Relevance:** Hero and section imagery — editorial content, not UI.

---

## Platform Coverage
- Desktop (1920px): yes — nodes 2:32236, 2:33451, 2:34360; loading state: 2:29014
- Desktop (1440px): yes — loading state at 2:28964
- Tablet (899px): yes — loading state at 2:29064; also within Font Generator Page section
- Mobile (375px): yes — node 2:28958 (loading state + full page); mobile filter panel variants at 2:28557, 2:28570, 2:28583
- iOS-specific: no
- Android-specific: no

## Journey Phases with Design Coverage
- [x] Upload / entry point (text input field — loads skeleton while fonts fetch, then user types)
- [x] Loading / processing (full skeleton state with shimmer animations for all font cards)
- [ ] Editor open (in iframe) — not shown; "Design with style" button launches Adobe Express but no iframe embed shown
- [ ] Success / download — not explicitly shown
- [ ] Error state — not shown
- [x] Empty / initial state (skeleton loading = initial state before fonts load)

## Key Interaction Flow
1. User lands on page — loading skeleton shown (all 12 font cards shimmer, text field empty)
2. Fonts load — cards populated with font previews; user types text into left panel input
3. Cards update in real-time to show user's text in each font style
4. User can filter by category (All / Popular / Cool / Fancy / Glitch / Symbol) or language
5. User clicks "Use this font" CTA on a card — likely copies unicode text or opens in Express
6. "Design with style" button in text field preview opens Adobe Express
7. Bottom CTA banner and sticky promo both funnel to "Get Adobe Express Free"

## Font Categories Shown in Design
1. 𝓐𝓵𝓵 — All fonts
2. 🅟🅞🅟🅤🅛🅐🅡 — Popular (circled letters style)
3. ⓒⓞⓞⓛ — Cool (circled letters)
4. ƒαɳ૮ყ — Fancy (script-like)
5. ̶G̶l̶i̶t̶c̶h̶ — Glitch (strikethrough/diacritic effect)
6. ❚█══Symbol══█❚ — Symbol (block/special character style)
