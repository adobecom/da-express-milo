# Slim PR — modal shell only (MWPW-185800)

The current PR has **37 files** because one commit included modal shell + Phase 2 comments + dev docs + tooling. To get a **modal-shell-only** PR (~15–18 files), use the list below.

---

## Files to INCLUDE in the slim PR (modal shell only)

| Path | Why |
|-----|-----|
| `express/code/scripts/color-shared/modal/createModalManager.js` | Manager (use current working tree — inlined announcer, no stub import). |
| `express/code/scripts/color-shared/modal/modal-styles.css` | Shell styles. |
| `express/code/scripts/color-shared/modal/createPaletteModal.js` | Modal content API. |
| `express/code/scripts/color-shared/modal/createGradientModal.js` | Modal content API. |
| `express/code/scripts/color-shared/modal/icons/close.svg` | Close icon. |
| `express/code/scripts/color-shared/modal/logModalDimensions.js` | Optional; not called in prod. |
| `express/code/scripts/color-shared/modal/README.md` | Optional doc. |
| `express/code/scripts/color-shared/modal/PROD_READINESS.md` | Optional doc. |
| `express/code/scripts/color-shared/modal/FIGMA_AND_TICKET_COMPARISON.md` | Optional doc. |
| `express/code/blocks/dev-color-shareui/README.md` | Dev block. |
| `express/code/blocks/dev-color-shareui/dev-color-shareui.css` | Dev block. |
| `express/code/blocks/dev-color-shareui/dev-color-shareui.js` | Dev block. |
| `express/code/blocks/dev-color-shareui/dev-color-shareui-modal.js` | Dev block (modal entry). |
| `express/code/blocks/dev-color-shareui/dev-color-shareui-stub-content.js` | Dev block (stub). |
| `test/scripts/color-shared/modal/createModalManager.test.js` | Tests. |
| `test/blocks/dev-color-shareui/dev-color-shareui.test.js` | Tests. |
| `test/blocks/dev-color-shareui/mocks/body.html` | Test mock. |

**Do not include:** `createModalStubContent.js`, `screenReaderAnnouncer.js` (removed / inlined).  
**Do not include:** `express/code/blocks/dev-color-shareui/shareui-modal.js` if you replaced it with `dev-color-shareui-modal.js` (delete shareui-modal from the branch).

---

## Files to EXCLUDE from this PR (other tickets / later)

- `dev/modal-shell/*` — move to `dev/19-modal-shell` or keep in a docs-only branch.
- `express/code/scripts/color-shared/ARCHITECTURE_AND_SCOPE.md` — can be a separate small PR.
- `express/code/scripts/color-shared/PHASE1_LOADER_OPTIONS.md`
- `express/code/scripts/color-shared/figma-5504-181748-file-palettes-gradients.md`
- `express/code/scripts/color-shared/adapters/litComponentAdapters.js` (Phase 2 comment)
- `express/code/scripts/color-shared/color-shared.css`
- `express/code/scripts/color-shared/components/*` (Phase 2 comments + createExploreDevBanner)
- `express/code/scripts/color-shared/renderers/*` (Phase 2 comments)
- `express/code/scripts/color-shared/services/*` (Phase 2 comments)
- `express/code/scripts/color-shared/utils/createLoadingStateManager.js` (Phase 2 comment)
- `scripts/figma-node-inspect.js` — tooling, separate PR or local only.

---

## Steps to create the slim PR

1. **Save current state** (your working tree has inlined announcer, stub in dev block, etc.):
   ```bash
   git add -A
   git status   # confirm modal + dev block + tests
   git commit -m "MWPW-185800: modal shell cleanup (announcer inlined, stub in dev block)"
   ```
   You now have 2 commits on `MWPW-185800`.

2. **Create slim branch from base**:
   ```bash
   git checkout -b MWPW-185800-slim origin/color
   ```

3. **Bring only modal-shell files from your branch** (use your branch name if not `MWPW-185800`):
   ```bash
   BRANCH=MWPW-185800
   git checkout $BRANCH -- \
     express/code/scripts/color-shared/modal/createModalManager.js \
     express/code/scripts/color-shared/modal/modal-styles.css \
     express/code/scripts/color-shared/modal/createPaletteModal.js \
     express/code/scripts/color-shared/modal/createGradientModal.js \
     express/code/scripts/color-shared/modal/icons/close.svg \
     express/code/scripts/color-shared/modal/logModalDimensions.js \
     express/code/scripts/color-shared/modal/README.md \
     express/code/scripts/color-shared/modal/PROD_READINESS.md \
     express/code/scripts/color-shared/modal/FIGMA_AND_TICKET_COMPARISON.md \
     express/code/blocks/dev-color-shareui/README.md \
     express/code/blocks/dev-color-shareui/dev-color-shareui.css \
     express/code/blocks/dev-color-shareui/dev-color-shareui.js \
     express/code/blocks/dev-color-shareui/dev-color-shareui-modal.js \
     express/code/blocks/dev-color-shareui/dev-color-shareui-stub-content.js \
     test/scripts/color-shared/modal/createModalManager.test.js \
     test/blocks/dev-color-shareui/dev-color-shareui.test.js \
     test/blocks/dev-color-shareui/mocks/body.html
   ```
   If `dev-color-shareui-modal.js` or `dev-color-shareui-stub-content.js` don’t exist on `$BRANCH` (only in working tree), copy them from your current branch after committing in step 1.

4. **Remove files we no longer ship** (if they were added by the big commit and still exist on `$BRANCH`):
   - On `MWPW-185800` the commit added `screenReaderAnnouncer.js` and `createModalStubContent.js`. After step 1 your branch has them removed. So when you `git checkout $BRANCH -- ...` you are checking out from the branch that now has 2 commits — the second commit should have removed those. If your second commit removed them, they won’t be in the tree when you checkout the modal folder. To be safe, after step 3:
   ```bash
   rm -f express/code/scripts/color-shared/modal/screenReaderAnnouncer.js \
         express/code/scripts/color-shared/modal/createModalStubContent.js
   git add -A express/code/scripts/color-shared/modal/
   ```
   If the dev block on `$BRANCH` still has `shareui-modal.js` and you’ve replaced it with `dev-color-shareui-modal.js`, remove the old one:
   ```bash
   rm -f express/code/blocks/dev-color-shareui/shareui-modal.js
   git add -A express/code/blocks/dev-color-shareui/
   ```

5. **Commit and push**:
   ```bash
   git add -A
   git status   # should show ~17 files
   git commit -m "MWPW-185800: feat(modal) color shared modal shell"
   git push origin MWPW-185800-slim
   ```
   Open a new PR from `MWPW-185800-slim` → `color`, or replace the existing PR branch:
   ```bash
   git push origin MWPW-185800-slim:MWPW-185800 --force
   ```
   (Only use `--force` if you’re sure you want to replace the current 37-file PR.)

---

## Count check

Before push, `git status` should show about **17 files** (or a few more if you add optional docs). If you see 37, you’re still including Phase 2 / docs / tooling — double-check the exclude list.
