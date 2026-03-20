# contrast-checker/services

Stateful service factories used by the renderers. Each factory returns a plain object with a defined public API — no DOM, no side-effects.

---

## createContrastDataService

```js
import createContrastDataService from './createContrastDataService.js';

const svc = createContrastDataService();

const results = svc.checkWCAG('#1B1B1B', '#FFFFFF');
// → { ratio: 16, normalAA: true, largeAA: true, normalAAA: true, largeAAA: true, uiComponents: true }

svc.isValidHex('#abc123'); // → true
svc.clearCache();
```

WCAG 2.1 contrast-ratio calculation with a per-instance LRU cache. `checkWCAG` returns pass/fail for all five WCAG criteria.

---

## createHistoryService

```js
import createHistoryService from './createHistoryService.js';

const history = createHistoryService(/* limit = 200 */);

history.push({ foreground, background });
history.undo();   // → previous state | null
history.redo();   // → next state | null
history.canUndo(); // → boolean
history.canRedo(); // → boolean
history.getStatus(); // → { past: number, future: number }
```

Three-stack history (past / current / future) capped at `limit` entries (default `HISTORY_LIMIT` from `contrastConstants`).

---

## createRecommendationService

```js
import createRecommendationService from './createRecommendationService.js';

const rec = createRecommendationService();

const suggestions = rec.getSuggestedColors(fg, bg, targetRatio);
// → [{ fg, bg }, …]  up to MAX_RECOMMENDATION pairs

rec.solveContrastRatio(fg, bg, targetRatio);
rec.findContrastRatioWithinGamut(fg, bg, targetRatio);
rec.findContrastingColor(baseHex, targetRatio);
```

Computes candidate color pairs that meet a target contrast ratio using xyY colorspace traversal. Falls back gracefully when no in-gamut solution exists.

---

## createKulerPaletteService

```js
import createKulerPaletteService from './createKulerPaletteService.js';

const kuler = createKulerPaletteService();

const palette = await kuler.fetchRandomPalette();
// → { id, name, colors: string[], source: 'kuler' } | null
```

Thin wrapper for fetching a random Kuler palette. Designed to be removable when no longer needed.

---

## contrastConversions

Pure conversion utilities (no factory) used internally by `createRecommendationService`:
- `convertsRGBtoxyY(r, g, b)`
- `convertxyYtosRGB(x, y, Y)`
- `deNormalizeRGB({ r, g, b })`
- `isInRGBGamut({ r, g, b })`
