# Local Dev: Spoofing color.stage.adobe.com

Routes `color.stage.adobe.com` to your local machine so your browser treats it as the real domain. Required for testing anything that depends on an `*.adobe.com` origin — most notably **IMS sign-in**, which only redirects back to registered Adobe origins, and the Express published video embed, which blocks iframes from `localhost` via CSP but allows `*.adobe.com`.

## Why color.stage.adobe.com (no `www.`)

`scripts.js` maps this project's Color stage environment under the exact key `color.stage.adobe.com` in `stageDomainsMap` (`express/code/scripts/scripts.js:67`). The match is exact — `www.color.stage.adobe.com` will **not** match, and the stage rewrites won't fire.

It also matters for IMS specifically:

- The `AdobeExpressWeb` IMS client (`scripts.js:80`) only redirects back to **registered** origins. `color.stage.adobe.com` is registered; `www.color.stage.adobe.com` is not → sign-in fails with a `redirect_uri` mismatch / login loop.
- Milo selects the **stg1** IMS environment automatically because the hostname contains `.stage.`. `?milolibs=local` does not change this.

> ⚠️ The single most common mistake is adding a `www.` prefix. The host must be exactly `color.stage.adobe.com`.

## One-Time Setup

### Install mkcert

```bash
brew install mkcert
mkcert -install
```

### Generate the certificate

```bash
cd /tmp
mkcert color.stage.adobe.com
```

Creates:
- `/tmp/color.stage.adobe.com.pem`
- `/tmp/color.stage.adobe.com-key.pem`

> The cert Common Name must be exactly `color.stage.adobe.com`. Do not reuse an old `www.stage.adobe.com` cert — the browser will reject it as a name mismatch before IMS even loads.

## Per-Session Steps

> **Note:** On this setup the hosts entry does not persist cleanly between sessions and the dev server has to come up fresh, so every session starts by resetting the hosts entry (Step 0) and restarting the server (Step 1).

### 0. Reset the hosts entry

Delete any stale entry and re-add a clean one. This is idempotent — safe to run every session:

```bash
sudo sed -i '' '/color\.stage\.adobe\.com/d' /etc/hosts
sudo sh -c 'echo "127.0.0.1 color.stage.adobe.com" >> /etc/hosts'
grep color.stage /etc/hosts   # verify: 127.0.0.1 color.stage.adobe.com
```

### 1. Start (or restart) the AEM dev server

```bash
aem up --url https://main--express-color--adobecom.aem.page
```

Confirm it's on `http://localhost:3000`. Use the `express-color` content host (not `da-express-milo`) so you serve the Color site's content, matching the spoofed origin.

### 2. Start the HTTPS proxy (separate terminal tab)

```bash
sudo npx local-ssl-proxy \
  --source 443 \
  --target 3000 \
  --cert /tmp/color.stage.adobe.com.pem \
  --key /tmp/color.stage.adobe.com-key.pem
```

`sudo` is required for port 443.

### 3. Open in browser

```
https://color.stage.adobe.com/<your-draft-page>?milolibs=local
```

The `?milolibs=local` parameter is required — without it, Milo tries to load `/libs` locally and fails (the `.stage.` hostname triggers local lib resolution).

For a clean IMS handshake, use a fresh private/incognito window or clear cookies for `*.adobe.com` so stale redirects from earlier attempts don't interfere.

### Verify IMS is working

After signing in, in the browser console:

```js
window.adobeIMS?.isSignedInUser()      // -> true
window.adobeIMS?.getAccessToken()?.token  // -> a token string
```

Feature code reads the token the same way (e.g. `express/code/scripts/utils/easy-upload-utils.js:134`).

## Known Limitations

- **LiveReload is broken** — The dev server's livereload WebSocket (`ws://`) is blocked on HTTPS pages. Refresh manually after changes.
- **sudo required** — The proxy must bind to port 443.
- **milolibs param required on every page load** — There is no way around this.
- **Hosts entry + server need resetting each session** — Run Step 0 and restart the server (Step 1) at the start of every session.

## Undo

```bash
# Remove hosts entry
sudo sed -i '' '/color\.stage\.adobe\.com/d' /etc/hosts

# Stop the proxy
Ctrl+C

# Clean up certs (optional)
rm /tmp/color.stage.adobe.com.pem /tmp/color.stage.adobe.com-key.pem
```

## Quick Reference

| Action | Command |
|--------|---------|
| Reset hosts entry | `sudo sed -i '' '/color\.stage\.adobe\.com/d' /etc/hosts && sudo sh -c 'echo "127.0.0.1 color.stage.adobe.com" >> /etc/hosts'` |
| Verify hosts entry | `grep color.stage /etc/hosts` |
| Remove hosts entry | `sudo sed -i '' '/color\.stage\.adobe\.com/d' /etc/hosts` |
| Start server | `aem up --url https://main--express-color--adobecom.aem.page` |
| Start proxy | `sudo npx local-ssl-proxy --source 443 --target 3000 --cert /tmp/color.stage.adobe.com.pem --key /tmp/color.stage.adobe.com-key.pem` |
| Stop proxy | `Ctrl+C` |
| Example test URL | `https://color.stage.adobe.com/drafts/yolles/embed?milolibs=local` |
