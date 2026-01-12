/* eslint-disable no-useless-escape */
const fs = require('fs');
const path = require('path');

function ensureSeoCheckLib(ext, isESM) {
  const seoFile = path.join(process.cwd(), 'nala', 'libs', `seo-check.${ext}`);
  if (!fs.existsSync(seoFile)) {
    const code = `${
      isESM ? "import { expect } from '@playwright/test';" : "const { expect } = require('@playwright/test');"
    }

export async function runSeoChecks({ page, feature }) {
  const issues = [];
  const title = await page.title();
  if (!title) issues.push('Missing title');
  const canonical = await page.locator('link[rel=\\\"canonical\\\"]').getAttribute('href');
  if (!canonical) issues.push('Missing canonical');
  if (issues.length) console.warn('[SEO WARN]', issues); else console.info('[SEO OK]', feature.name);
}
`;
    fs.mkdirSync(path.dirname(seoFile), { recursive: true });
    fs.writeFileSync(seoFile, code, 'utf-8');
  }
}

function ensureAccessibilityLib(ext, isESM) {
  const a11yFile = path.join(process.cwd(), 'nala', 'libs', `accessibility.${ext}`);
  if (!fs.existsSync(a11yFile)) {
    const code = `${
      isESM ? "import { expect } from '@playwright/test';" : "const { expect } = require('@playwright/test');"
    }
// TODO: integrate axe-core properly; placeholder to keep suite wiring intact
export async function runAccessibilityTest({ page, testScope }) {
  if (testScope) await expect(testScope).toBeVisible();
  console.info('[Accessibility Test]: Placeholder — integrate axe-core here');
}
`;
    fs.mkdirSync(path.dirname(a11yFile), { recursive: true });
    fs.writeFileSync(a11yFile, code, 'utf-8');
  }
}

module.exports = { ensureSeoCheckLib, ensureAccessibilityLib };
