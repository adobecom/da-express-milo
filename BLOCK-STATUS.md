# Block status

Every block in `express/code/blocks/` is **Active** unless it's listed below. Check this list before editing a block.

## Block lifecycle statuses

- **Active**: Fully supported, including new features.
- **Maintenance**: Bug, accessibility, localization (including RTL) and security fixes only. Archived by design but support is still needed because of wide usage. Moves to Deprecated once/if a replacement and migration plan exist.
- **Deprecated**: Critical fixes only. Authors and developers are warned not to use it. Needs a migration plan attached. After migration, the code is removed.
- **Removed**: The code is gone. When you delete a block's code, delete its row from the Deprecated table and from `/consonant.json`.

## Process

1. **Propose:** Design archives a block or variant in the [Figma block archive](https://www.figma.com/design/CVKL1UgmhqbW7VdECOREJU/-express-block-archive). Check its usage with the `affected-pages` skill and the [Block Index tool](https://da.live/app/maxn-adobe/da-tools/block-index/dist/index). Low usage goes to Deprecated, wide usage to Maintenance.
2. **Mark:** Add it to the table below. For Deprecated, also add a row to the DA sheet `/consonant.json` (Block, Variant, Decision `Deprecated`, Documentation) and preview the sheet. Authors then see a "Deprecated" label on the block in preview.
3. **Migrate:** For each Deprecated block with live pages, create an authoring ticket listing every page to update or delete.
4. **Remove:** Once no live pages use it, delete the code and its rows.

## Deprecated

| Block | Replacement | Ticket |
|---|---|---|
| `app-banner` | `floating-button` | [DOTCOM-201140](https://jira.corp.adobe.com/browse/DOTCOM-201140) |
| `quick-action-hub` | Remove instead of replacing | [DOTCOM-201141](https://jira.corp.adobe.com/browse/DOTCOM-201141) |
| `page-list` | | |
| `tabs-ax` | None | |
| `toggle-bar` | None | |
| `split-action` | None | |
| `promotion` | None. The code stays because it hides all authored instances. | |

## Maintenance

| Block | Variant |
|---|---|
| `banner` | default |
| `banner` | cool |
| `steps` | highlight |
| `faq` | |
| `how-to-steps-carousel` | |
| `icon-list` | |
| `feature-list` | |
| `blog-posts` | |
| `how-to-steps` | |
| `content-toggle` | |
| `simplified-pricing-cards` | |
| `feature-grid` | |
