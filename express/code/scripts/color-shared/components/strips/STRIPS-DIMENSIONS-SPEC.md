# Strips L/M/S — Canonical dimensions (source of truth)

**Use for accuracy:** Media queries, palette card CSS, and Figma alignment should match these values.

From the color-explore demo (Strips L/M/S) — rendered output:

| Size | Width × Height | Breakpoint |
|------|----------------|------------|
| **L** | 437 × 116 px | Desktop (1200px+), grid 3 cols |
| **M** | 410 × 88 px | Desktop / mobile |
| **M tablet** | 610 × 88 px | 600–679px (Figma 5659-62614) |
| **S** | 342 × 88 px | Mobile |

**Grid:** 1360px content, 24px gap. L width ≈ (1360 − 2×24) / 3 ≈ 437px. M/tablet runs 1 col until 679px. Breakpoints: 680px (2 cols), 1200px (3 cols) — MWPW-185804.

**Column min-width by breakpoint:** Mobile 300px; Tablet (680px+) 410px (M card); Desktop (1200px+) 400px.

---

## Height by breakpoint (verify against Figma)

| Breakpoint | Viewport | L height | M height | M tablet height | S height |
|------------|----------|----------|----------|-----------------|----------|
| Mobile | &lt; 600px | 116px | 88px | — | 88px |
| Tablet | 600–679px | 116px | 88px | 88px | 88px |
| Tablet+ | 680–1199px | 116px | 88px | — | 88px |
| Desktop | 1200px+ | 116px | 88px | — | 88px |

**Current implementation:** All sizes use fixed heights (L 116px, M/S 88px) at every breakpoint. Run Figma REST inspect on spec nodes to confirm.
