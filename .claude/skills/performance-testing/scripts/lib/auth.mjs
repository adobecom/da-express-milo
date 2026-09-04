/**
 * Reused browser auth state for IMS/Adobe-SSO-gated URLs (e.g. `.aem.page`
 * stage previews, which 401 without a login).
 *
 * There's no static credential or API key for this — it's an interactive SSO
 * redirect, the same login you'd hit clicking the URL in your own browser.
 * So the only automatable fix is: log in once for real (see login.mjs),
 * save the resulting cookies/localStorage via Playwright's `storageState`,
 * and reuse that saved state in every throttled measurement run afterward.
 *
 * This file lives next to compare.mjs's node_modules, not inside it, and is
 * gitignored — it holds live session data, not a secret to commit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const AUTH_STATE_PATH = path.join(__dirname, '..', '.auth-state.json');

export function hasAuthState() {
  return fs.existsSync(AUTH_STATE_PATH);
}
