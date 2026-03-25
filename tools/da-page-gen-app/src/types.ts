// ---------------------------------------------------------------------------
// Wizard state
// ---------------------------------------------------------------------------

export type WizardStep = 'source' | 'template' | 'bindings' | 'generate';

// ---------------------------------------------------------------------------
// Bindings
// ---------------------------------------------------------------------------

export type Transform = 'none' | 'slug' | 'uppercase' | 'lowercase';

/**
 * One binding entry maps a template token to a field in each data record.
 *
 * @example
 * { token: "[[title]]", dataPath: "product.title", transform: "none" }
 * { token: "[[sku]]",   dataPath: "id",             transform: "uppercase" }
 */
export interface Binding {
  /** Exact token as it appears in the template HTML, e.g. `[[title]]` */
  token: string;
  /** Dot-notation path into each data record, e.g. `product.title` or `variants.0.sku` */
  dataPath: string;
  transform: Transform;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export type ItemStatus = 'idle' | 'generating' | 'done' | 'error';

/** Display item returned by POST /bindings/resolve */
export interface ResolvedItem {
  destPath: string;
  /** dataPath → resolved value, for display in the table */
  preview: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Server API shapes (mirrors da-page-gen-server types)
// ---------------------------------------------------------------------------

export interface TemplateResolveResponse {
  sourcePath: string;
  html: string;
  placeholders: string[];
}

export interface GenerateResultItem {
  destPath: string;
  success: boolean;
  editUrl?: string;
  error?: string;
}
