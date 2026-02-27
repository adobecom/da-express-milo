# Local & preflight troubleshooting

When running on **localhost:3000** or a branch URL, you may see 404s, CORS, and one uncaught error. Here’s what they are and what to do.

---

## 1. `structure.js` – `Cannot read properties of undefined (reading 'enabled')`

- **Where:** Milo preflight / structure checks (not in this repo).
- **Cause:** Preflight expects a config object (e.g. geo routing) that is `undefined` in your environment.
- **What to do:**
  - Ensure your environment provides the config Milo expects (e.g. from `.milo` or site config).
  - Or run without the preflight / structure checks (e.g. different Milo mode or build).
  - Upstream fix belongs in Milo, not here.

---

## 2. `.milo/publish-permissions-config.json` 404

- **Cause:** Milo/sidekick is asking for a publish-permissions config that doesn’t exist for this project or branch.
- **What to do:**
  - Add a stub at `.milo/publish-permissions-config.json` if you need that tooling.
  - Or ignore if you’re not using publish-permissions.

---

## 3. CORS when fetching from `https://www.adobe.com/...` or IMS

- **Examples:**
  - `https://www.adobe.com/drafts/yeiber/color/phase-one/gradients` from `http://localhost:3000`
  - `https://adobeid-na1-stg1.services.adobe.com/ims/check/...` from `http://localhost:3000`
- **Cause:** The browser blocks cross-origin requests when the target server doesn’t send `Access-Control-Allow-Origin` for your origin (localhost or branch).
- **What to do:**
  - **Color/gradients:** Prefer a **relative** `apiEndpoint` in the block config (e.g. `apiEndpoint` = `/api/color/gradients`) and run a **local proxy** that forwards `/api/*` to the real backend. Then the request is same-origin (localhost → localhost).
  - Or use a **branch preview URL** (e.g. `https://<branch>--da-express-milo--adobecom.aem.page/...`) so the page and API are on the same origin.
  - **IMS:** Auth checks from localhost are often blocked by CORS; use branch preview for logged-in flows or a local proxy that forwards to IMS.

---

## 4. `spidy.gwp.corp.adobe.com//api/url-http-status` 404

- **Cause:** Internal analytics/URL-status API not available or wrong path (note the double slash).
- **What to do:** Ignore for local dev, or fix the URL in whatever script calls it (likely in shared/Milo tooling).

---

## 5. Blocks load locally but “Failed to fetch dynamically imported module” on remote (branch preview)

- **Example:**  
  `Failed loading color-explore TypeError: Failed to fetch dynamically imported module: https://<branch>--da-express-milo--adobecom.aem.page/express/code/blocks/color-explore/color-explore.js`
- **Where:** Milo’s block loader (e.g. `loadArea`) runs in the browser; the message appears in the console (often under `utils.js` from the **Milo libs**, not this repo).
- **Cause:** The browser loads block scripts from the **same origin** as the page. On the branch preview URL, that origin is `https://<branch>--da-express-milo--adobecom.aem.page`. If that host returns 404, wrong MIME type, or another error for `/express/code/blocks/<block>/<block>.js`, the dynamic `import()` fails.
- **What to do:**
  1. **Check the request:** Open DevTools → Network, reload, find the request to `.../blocks/color-explore/color-explore.js` (or the failing block). Note the **HTTP status** (404, 403, 500?) and **Content-Type** (should be `application/javascript` or `text/javascript` for ES modules).
  2. **Try the URL in the address bar:** Open  
     `https://<branch>--da-express-milo--adobecom.aem.page/express/code/blocks/color-explore/color-explore.js`  
     (replace `<branch>` with your branch name). If you get 404, the preview host is not serving that file for this branch.
  3. **Branch vs main:** Ensure your branch is pushed and that the preview deployment includes `/express/code/blocks/`. Some setups serve **code** from `main` and only **content** from the branch; in that case, new blocks that exist only on your branch won’t be available until merged to `main`, or until the preview is configured to use branch code.
  4. **Wait for deploy:** After pushing, the branch preview may take a few minutes to update.
  5. **Milo libs vs block scripts:** Adding `?milolibs=<branch>` only changes where **Milo libs** load from; block scripts still come from the page origin, so it won’t fix 404s for block JS files.

---

## Summary

| Issue | In this repo? | Fix |
|-------|----------------|-----|
| structure.js / checkGeorouting | No (Milo) | Provide expected config or run without that check |
| publish-permissions-config 404 | No (Milo) | Add stub or ignore |
| CORS to adobe.com / IMS | Config / env | Use relative API + proxy, or branch preview URL |
| spidy 404 | Probably not | Ignore locally or fix caller URL |
| Block “Failed to fetch dynamically imported module” on remote | No (loader in Milo) | Check 404/MIME on block URL; ensure branch code is deployed or merge to main |

Using a **branch preview** URL instead of localhost often avoids CORS and matches production behavior better.
