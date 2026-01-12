/* eslint-disable no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { expect } from '@playwright/test';

export async function runSeoChecks({ page, feature }) {
  const issues = [];
  const title = await page.title();
  if (!title) issues.push('Missing title');
  const canonical = await page.locator('link[rel=\"canonical\"]').getAttribute('href');
  if (!canonical) issues.push('Missing canonical');
  if (issues.length) console.warn('[SEO WARN]', issues); else console.info('[SEO OK]', feature.name);
}
