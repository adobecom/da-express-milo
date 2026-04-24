// _id is a string so it satisfies the string index signature
export type CsvRow = Record<string, string>;

export interface InputSummary {
  total: number;
  valid: number;
  duplicates: number;
  missing: number;
}

export type TemplateStatus = 'idle' | 'loading' | 'ready' | 'warning' | 'invalid' | 'error';

export interface TemplateState {
  status: TemplateStatus;
  html: string | null;
  sourcePath: string | null;
  placeholders: string[];
  issues: string[];
}
