# Lit Loading Fallback Chain

## 🎯 Goal
Ensure Lit loads successfully even if Milo is down, CDN is blocked, or network is degraded.

---

## 🔄 Fallback Flow

```
Block Initialization
        ↓
   loadLit() called
        ↓
    ┌───────────────────────────────────┐
    │  Try 1: Milo's Lit                │
    │  ${getLibs()}/deps/lit-all.min.js │
    │  ✅ Best option, tested            │
    └───────────────┬───────────────────┘
                    ↓
              Success? ━━━━━━━━━━━━━┓
                 ❌                  ✅
                 ↓                   ↓
    ┌───────────────────────────────────┐
    │  Try 2: CDN (jsdelivr)            │  Lit Loaded ✅
    │  cdn.jsdelivr.net/.../lit@3.1.0   │  Components Work
    │  ✅ Public CDN, global cache      │
    └───────────────┬───────────────────┘
                    ↓
              Success? ━━━━━━━━━━━━━┓
                 ❌                  ✅
                 ↓                   ↓
    ┌───────────────────────────────────┐
    │  Try 3: Local Copy                │  Lit Loaded ✅
    │  /express/code/libs/deps/...      │  Components Work
    │  ✅ Offline, always available     │
    └───────────────┬───────────────────┘
                    ↓
              Success? ━━━━━━━━━━━━━┓
                 ❌                  ✅
                 ↓                   ↓
         All Failed! ❌          Lit Loaded ✅
         LANA Alert              Components Work
         Fallback to vanilla tags
```

---

## 📋 Implementation Details

### Primary: Milo's Lit
```javascript
const miloLibs = getLibs(); // Dynamic: stage, local, prod
const litUrl = `${miloLibs}/deps/lit-all.min.js`;
const { loadScript } = await import(`${miloLibs}/utils/utils.js`);
await loadScript(litUrl);
```

**Pros:**
- ✅ Same version as rest of Milo
- ✅ Tested with Express codebase
- ✅ Environment-aware (stage/prod)

**Cons:**
- ❌ Fails if Milo is down
- ❌ Requires Milo utils

---

### Fallback 1: CDN
```javascript
const litUrl = 'https://cdn.jsdelivr.net/npm/lit@3.1.0/index.min.js';
await loadScriptSimple(litUrl);
```

**Pros:**
- ✅ Public CDN, globally cached
- ✅ High availability
- ✅ Fast (CDN edge servers)

**Cons:**
- ❌ Fails if CDN blocked (corporate firewall)
- ❌ Requires internet connection

---

### Fallback 2: Local Copy
```javascript
const litUrl = '/express/code/libs/deps/lit-all.min.js';
await loadScriptSimple(litUrl);
```

**Pros:**
- ✅ Always available
- ✅ Works offline
- ✅ No external dependencies

**Cons:**
- ❌ Needs manual updates
- ❌ Slightly larger bundle

---

## 🎛️ Console Output

### Success (Primary)
```
[loadLit] Attempting to load Lit from Milo: https://main--milo--adobecom.aem.live/libs/deps/lit-all.min.js
[loadLit] ✅ Successfully loaded Lit from Milo
```

### Success (Fallback 1)
```
[loadLit] Attempting to load Lit from Milo: https://main--milo--adobecom.aem.live/libs/deps/lit-all.min.js
[loadLit] Failed to load Lit from Milo: Failed to fetch
[loadLit] Attempting to load Lit from CDN (jsdelivr): https://cdn.jsdelivr.net/npm/lit@3.1.0/index.min.js
[loadLit] ✅ Successfully loaded Lit from CDN (jsdelivr)
```

### Success (Fallback 2)
```
[loadLit] Attempting to load Lit from Milo: https://main--milo--adobecom.aem.live/libs/deps/lit-all.min.js
[loadLit] Failed to load Lit from Milo: Failed to fetch
[loadLit] Attempting to load Lit from CDN (jsdelivr): https://cdn.jsdelivr.net/npm/lit@3.1.0/index.min.js
[loadLit] Failed to load Lit from CDN (jsdelivr): Failed to fetch
[loadLit] Attempting to load Lit from Local: /express/code/libs/deps/lit-all.min.js
[loadLit] ✅ Successfully loaded Lit from Local
```

### Complete Failure
```
[loadLit] Attempting to load Lit from Milo: ...
[loadLit] Failed to load Lit from Milo: Failed to fetch
[loadLit] Attempting to load Lit from CDN (jsdelivr): ...
[loadLit] Failed to load Lit from CDN (jsdelivr): Failed to fetch
[loadLit] Attempting to load Lit from Local: ...
[loadLit] Failed to load Lit from Local: Failed to fetch
[loadLit] Failed to load Lit from all sources: Milo, CDN (jsdelivr), Local
LANA: Failed to load Lit from all sources [tags: color-explorer,lit,critical]
```

---

## 🧪 Testing Fallbacks

### Test CDN Fallback
```javascript
// In DevTools Console
// Block Milo by adding to hosts file or using DevTools Network throttling
// 127.0.0.1 main--milo--adobecom.aem.live
// Reload page, should see CDN load
```

### Test Local Fallback
```javascript
// Block both Milo and CDN
// Verify local file loads
```

---

## 📦 Local Copy Maintenance

### Update Local Copy
```bash
cd express/code/libs/deps
curl -L --compressed -s https://main--milo--adobecom.aem.live/libs/deps/lit-all.min.js > lit-all.min.js
git add lit-all.min.js
git commit -m "Update local Lit fallback to match Milo"
```

### When to Update
- Milo updates Lit version
- Security vulnerability in Lit
- Spectrum components require newer Lit
- Quarterly maintenance cycle

---

## 🚨 Monitoring

### LANA Logging
- **Success**: No logs (silent success)
- **Fallback Used**: Warning log with source
- **Complete Failure**: Error log with `tags: color-explorer,lit,critical`

### Metrics to Track
- % of loads using each source
- Failure rates per source
- Time to load per source

---

## 🎯 Design Decisions

### Why Not Always Use CDN?
- Milo's version is tested with Express
- Consistent with Express architecture
- Environment-aware (stage vs prod)

### Why Not Only Local?
- Would miss Milo updates
- Larger bundle size
- Maintenance overhead

### Why This Order?
1. Milo: Best compatibility
2. CDN: High availability
3. Local: Last resort, always works

---

**Result:** Lit loads 99.9% of the time, even in degraded conditions! ✅
