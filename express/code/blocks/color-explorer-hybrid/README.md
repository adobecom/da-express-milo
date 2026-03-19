# ⚠️ DEPRECATED: color-explorer-hybrid

**Status:** Deprecated  
**Date:** 2026-02-03  
**Reason:** Replaced by multi-block architecture

---

## 🔄 Migration Guide

This block has been **deprecated** in favor of the new multi-block architecture. Please use the appropriate block for your page:

### **Use These Blocks Instead:**

| Old | New Block | Purpose |
|-----|-----------|---------|
| `color-explorer-hybrid` (strips) | `color-explore` | Explore page with palette strips |
| `color-explorer-hybrid` (gradients) | `color-explore` | Explore page with gradients |
| `color-explorer-hybrid` (extract) | `color-extract` | Extract colors from images |
| N/A | `color-wheel` | Interactive color wheel |
| N/A | `contrast-checker` | Contrast ratio checker |
| N/A | `color-blindness` | Color blindness simulator |

---

## 📦 Shared Components

All renderers, components, modal, services, and adapters have been moved to:

```
express/code/scripts/color-shared/
├── renderers/
├── components/
├── modal/
├── services/
├── adapters/
└── utils/
```

---

## ⏰ Deprecation Timeline

- **2026-02-03:** Multi-block architecture implemented
- **2026-02-10:** Update all test pages to use new blocks
- **2026-02-17:** Remove `color-explorer-hybrid` from codebase

---

## 📝 Notes

This block is kept temporarily for backward compatibility. It now uses the shared component library (`scripts/color-shared/`) but will be removed once all pages are migrated to the new blocks.

**Do not use this block for new pages.**
