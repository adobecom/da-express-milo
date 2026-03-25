import type { Binding } from '../types.js';
import { enumeratePaths } from './jsonPath.js';

/**
 * Create a default binding for a detected template token.
 * Attempts a best-effort match against available data paths.
 */
export function defaultBinding(token: string, firstRecord: unknown): Binding {
  const available = enumeratePaths(firstRecord);
  const inner = token.replace(/^\[\[/, '').replace(/\]\]$/, '');
  const match = available.find((p) => p === inner || p.endsWith(`.${inner}`));
  return { token, dataPath: match ?? inner, transform: 'none' };
}
