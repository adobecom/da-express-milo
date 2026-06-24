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
