// _id is a string so it satisfies the string index signature
export type CsvRow = Record<string, string>;

export interface InputSummary {
  total: number;
  duplicates: number;
  duplicateSlugs: number;
  missing: number;
  duplicateProductIdRowIds: Set<string>;
  duplicateSlugRowIds: Set<string>;
}

export interface ProductTypeConfig {
  productType: string;
  templatePath: string;
  outputDir: string;
}

export type RowStage =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'qa-fail'
  | 'previewing'
  | 'previewed'
  | 'publishing'
  | 'published'
  | 'unpublishing'
  | 'unpublished'
  | 'deleting'
  | 'error';

export interface QaCheck {
  id: string;
  label: string;
  description: string;
  pass: boolean;
}

export interface QaResult {
  pass: boolean;
  checks: QaCheck[];
}

export interface RowResult {
  id: string;
  path: string;
  stage: RowStage;
  error?: string;
  editUrl?: string;
  previewUrl?: string;
  liveUrl?: string;
  qa?: QaResult;
}

export interface ManagedDocIdentity {
  productType?: string;
  productId?: string;
  generatedBatch?: string;
  lastUpdated?: string;
}

export type GmcEnv = 'test' | 'prod';

export type GmcStatus = 'pending' | 'live' | 'disapproved' | 'error';

export interface GmcEnvState {
  status: GmcStatus;
  lastSubmittedAt?: string;
  lastCheckedAt?: string;
  /** Failure/disapproval reason, shown on hover — see GMC-Status-Sync-PRD.md §9. */
  message?: string;
}

export interface ManagedDoc extends RowResult {
  /** Folder containing this doc, relative to the scanned root path (e.g. "/hoodie"). */
  subDirectory: string;
  identity: ManagedDocIdentity;
  /** True if product-type or product-id metadata is missing (predates the metadata contract). */
  needsBackfill: boolean;
  /** True if the publish/preview status check failed (rate-limited/unreachable) — the real state is unknown, not "draft". */
  statusUnknown?: boolean;
  title?: string;
  shortTitle?: string;
  description?: string;
  editable: {
    title: boolean;
    shortTitle: boolean;
    description: boolean;
  };
  /** Per-environment GMC submission state. Absence of a given env's entry means "Not submitted". */
  gmc?: {
    test?: GmcEnvState;
    prod?: GmcEnvState;
  };
}
