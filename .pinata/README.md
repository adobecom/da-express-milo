# `.pinata/` — Express's harness contract

This folder is how Adobe Express (`adobecom/da-express-milo`) drives the
**pinata-code** harness as tenant `acom:express`. The harness reads these files
from GitHub at the pinned commit and holds no Express-specific knowledge of its
own — everything Express-specific lives here.

| File | What it declares |
|------|------------------|
| `manifest.yaml` | Express's identity (`org`/`product`/`repo`), where ownership comes from (`.github/CODEOWNERS`), and which shared mental models the planner uses (`express-core`, `milo-core`). |
| `gates.yaml` | Express's verification gates. When present, these **replace** the harness's built-in default gate set. |
| `pr.yaml` | Branch naming and the PR body, shaped like `.github/pull_request_template.md`. |
| `floor/gates.yaml` | Snapshot of the acom org floor the gates may tighten but never weaken. |
| `scripts/` | Helper scripts: the block-structure gate and the contract self-check. |

## Gates

`gates.yaml` declares six gates, all blocking:

- **lint** — `npx eslint {js_files}` with `.eslintrc.cjs`, repaired with `--fix`.
- **compat-lint** — `.eslintrc-code-compatibility.js` (browser support from
  `.browserslistrc`), the same config `code-compatibility.yaml` runs in CI.
- **stylelint** — `npx stylelint {css_files}` with `.stylelintrc.json`.
- **unit-tests** — Web Test Runner (`web-test-runner.config.js`, port 2000) on
  the affected files inside `test/**/*.test.js`. Nala E2E specs are out of
  scope: they need live pages and credentials.
- **block-structure** — `node .pinata/scripts/check-block-structure.mjs {changed_files}`:
  every changed `express/code/blocks/<name>/` must contain both `<name>.js` and
  `<name>.css`.
- **visual** — advisory: captures the ticket's targets (or a declared surface
  in `preview.yaml`) at 375 and 1200 px from a local dev server and asks the
  vision judge; its verdict is recorded but never blocks.
- **adversary** — independent-model review, required by the acom floor; a
  rejection sends the change through a bounded producer rebuild
  (`regeneration.max_candidates: 5`, the floor's ceiling).

Not declared, and why, is written at the top of `gates.yaml`: no `lint:css-vars` gate (CI does not run it), and no coverage gate
(codecov enforces patch coverage on the PR).

The full unit suite on `stage` is not entirely green on every machine (a few
timing-sensitive color-shared and comparison-table cases). The harness forgives
a failure the base commit shares, so those do not block unrelated changes.

## Preview

`preview.yaml` serves the diff-applied worktree with the AEM CLI on port 3456,
proxying content from the public `main--da-express-milo--adobecom.aem.live`
host, so the advisory `visual` gate needs no credential for published pages.
URLs pasted from `*--da-express-milo--*` or `www.adobe.com` are rendered by
that local server by path.

The `.aem.page` preview host is auth-gated. Draft pages that exist only there
need a site token: a site administrator creates one once (config service,
`POST admin.hlx.page/config/adobecom/sites/da-express-milo/secrets.json`) and
the platform team sets it as `AEM_SITE_TOKEN_DA_EXPRESS_MILO` in the engine
environment. The IMS automation account (`pinata+masautomation@adobetest.com`,
password from the engine's `IMS_PASS`) is declared but dormant.

## Checking the contract

```bash
python3 .pinata/scripts/check-contract.py   # needs PyYAML
```

It checks the files' required shapes, that `gates.yaml` does not weaken
`floor/gates.yaml`, and that every mental-model id exists in
`Adobe-acom/pinata-tool-shelf`.

## Mental models

`manifest.yaml`'s `mental_models.use` lists the models Express selects by id.
The **selection** is Express's; the model **content** is shared and resolved
from the registry at run time.
