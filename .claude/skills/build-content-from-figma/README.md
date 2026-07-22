# build-content-from-figma

Extracts content from Figma frames (text, headings, links, icons, images) and produces an authored HTML document following the Express EDS block authoring pattern. Downloads Figma assets locally, uploads them to DA via the admin API, then uploads the HTML document and optionally previews and publishes it.

---

## Prerequisites

### MCPs

| MCP | Notes |
|-----|-------|
| Figma | Official Figma MCP. Requires Figma Dev Mode access. |

```sh
claude mcp add --transport http figma https://mcp.figma.com/mcp --scope user
# Then in Claude: /mcp → choose figma → authenticate
```

### da-auth-helper

```sh
npm install -g github:adobe-rnd/da-auth-helper
da-auth-helper login  # choose the Skyline profile
```

The token is cached at `~/.aem/da-token.json` and refreshed automatically.

---

## Run

```
/build-content-from-figma
```

The skill will prompt for:

| Input | Required | Example |
|-------|----------|---------|
| Figma URL(s) | At least one | One URL per viewport (mobile / tablet / desktop) |
| DA organization | Yes | `adobecom` |
| DA repository | Yes | `da-express-milo` |
| DA file path | Yes | `drafts/methomas/my-page.html` |

## Output

An HTML document uploaded to DA, media assets in the shadow folder (`content.da.live`), and optionally a previewed and published page at `https://main--da-express-milo--adobecom.aem.live/<path>`. The DA edit link is reported in the final summary.
