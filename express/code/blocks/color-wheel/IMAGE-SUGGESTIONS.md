# Sample images for the Color Wheel “Image” tab

The suggestions strip (“Don’t have an image? Try one of ours:”) reads **optional** `<picture>` elements from the **Color Wheel** block in your document.

## Authoring (Franklin / DA)

Add a **table row** to the same Color Wheel block:

| First column (header text) | Second column |
|----------------------------|---------------|
| `Suggestions`              | One or more `<picture>` elements (same pattern as the Color Extract block’s suggestions row). |

The first column text is matched case-insensitively after normalizing spaces (must equal `suggestions`).

If you omit this row or leave the second column empty, the UI still shows the heading and a short note that no samples are configured—no image assets are bundled in the repo.

## Reference

The Color Extract block uses the same structure for its second content row; you can mirror that markup for consistency.
