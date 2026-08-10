// Shared column layout for a product table: the column-header row and every data row use the same
// fixed pixel widths so columns stay aligned while rows are absolutely-positioned by the
// virtualizer. Columns: select · warning · image · Title · Description · Product type · Price ·
// Sale price · Page · Country · Status. The image column is wide enough for the on-demand "View"
// button (images load lazily to avoid fetching ~1k thumbnails up front).
//
// Fixed widths (not fr/minmax) so the table has a real total width and scrolls horizontally on
// narrow screens (same pattern as DocumentManagerTable) instead of squashing/overlapping columns.
export const GMC_COLUMN_WIDTHS = [36, 40, 96, 300, 360, 150, 84, 84, 64, 200, 150];
export const GMC_GRID = GMC_COLUMN_WIDTHS.map((w) => `${w}px`).join(' ');
export const GMC_GRID_WIDTH = GMC_COLUMN_WIDTHS.reduce((a, b) => a + b, 0);
