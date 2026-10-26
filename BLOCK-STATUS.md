# Block status

Every block in `express/code/blocks/` is **Active** unless it's listed below. Check this list before editing a block.

Background: [Express block deprecation proposal](https://wiki.corp.adobe.com/x/R2d28w). Tracking: [MWPW-210110](https://jira.corp.adobe.com/browse/MWPW-210110).

## Block lifecycle statuses

- **Active**: Fully supported, including new features.
- **Maintenance**: Bug, accessibility, localization (including RTL) and security fixes only. Archived by design but support is still needed because of wide usage. Moves to Deprecated once/if a replacement and migration plan exist.
- **Deprecated**: Critical fixes only. Authors and developers are warned not to use it. Needs a migration plan attached. After migration, the code is removed.
- **Removed**: The code is gone. When you delete a block's code, delete its row here too.

Authors see a "Deprecated" label on these blocks in preview, driven by the DA sheet `/consonant.json`. Keep that sheet in sync with the Deprecated table.

## Deprecated

| Block | Replacement | Ticket |
|---|---|---|
| `app-banner` | `floating-button` | [DOTCOM-201140](https://jira.corp.adobe.com/browse/DOTCOM-201140) |
| `quick-action-hub` | Remove instead of replacing | [DOTCOM-201141](https://jira.corp.adobe.com/browse/DOTCOM-201141) |
| `page-list` | Pending PM input | |
| `tabs-ax` | None needed (0 uses) | |
| `toggle-bar` | None needed (0 uses) | |
| `split-action` | None needed (0 uses) | |
| `promotion` | None needed. The code stays indefinitely because it hides all authored instances. | |

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
