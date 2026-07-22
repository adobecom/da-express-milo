# build-block-from-figma

Builds a new block component for adobe.com/express from Figma designs. Reads Figma frames, generates block JS and CSS under `express/code/blocks/`, then runs a visual comparison loop (Playwright), an axe-core accessibility audit (WCAG 2.2 AA), and a Lighthouse performance audit. Supports localhost dev servers and DA-published (`.aem.live`) pages via a remote feature branch.

---

## Prerequisites

### MCPs

| MCP | Notes |
|-----|-------|
| Figma | Official Figma MCP. Requires Figma Dev Mode access. |
| Playwright | Browser automation for visual validation. |
| Fluffyjaws | EDS/AEM convention lookups. Requires Adobe VPN. |

**Figma**

```sh
claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user
# Then in Claude: /mcp → choose figma → authenticate
```

**Playwright**

```sh
claude mcp add playwright npx @playwright/mcp@latest --scope user
```

**Fluffyjaws** (requires Adobe VPN)

Step 1 — install the CLI:

```sh
API_BASE=https://fluffyjaws.adobe.com; \
if curl -fsSL "$API_BASE/" -o /dev/null 2>/dev/null; then \
  curl -fsSL "$API_BASE/api/cli/install.sh" | bash; \
else echo "VPN required. Connect to VPN and retry." 1>&2; false; fi
```

Step 2 — add to `~/.claude.json` under `mcpServers`:

```json
"fluffyjaws": {
  "type": "stdio",
  "command": "/opt/homebrew/bin/fj",
  "args": ["mcp"]
}
```

After adding all three MCPs, close and reopen Claude, then run `/mcp` to confirm the connections are active.

### Node dev dependencies

Requires Node 22:

```sh
nvm install 22 && nvm alias default 22
npm install --save-dev lighthouse chrome-launcher @axe-core/playwright
```

---

## Run

```
/build-block-from-figma
```

The skill will prompt for:

| Input | Required | Example |
|-------|----------|---------|
| Preview URL | Yes | `http://localhost:3000/path` or `https://main--da-express-milo--adobecom.aem.live/path` |
| Figma URL — Mobile (< 600px) | At least one | Figma frame link |
| Figma URL — Tablet (600–899px) | No | Figma frame link |
| Figma URL — Desktop (900–1199px) | No | Figma frame link |
| Figma URL — Large desktop (≥ 1200px) | No | Figma frame link |
| Base branch | No (default: `stage`) | `methomas/my-feature` |

## Output

New files at `express/code/blocks/<name>/<name>.js` and `.css`, optionally a feature branch on `adobecom/da-express-milo` (remote mode), and a final summary with accessibility and performance results.
