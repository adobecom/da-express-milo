/**
 * Color Explorer Hybrid - Entry Point
 *
 * Curated Plugin test harness via direct instantiation.
 * All test code is in isolated functions — remove this section
 * when the real block implementation replaces it.
 */

// #region --- Curated Test Harness (removable) ---

import CuratedPlugin from '../../libs/services/plugins/curated/CuratedPlugin.js';
import { createCuratedProvider } from '../../libs/services/providers/CuratedProvider.js';
import { CuratedSources } from '../../libs/services/plugins/curated/topics.js';

const CURATED_BASE_URL = 'https://d2ulm998byv1ft.cloudfront.net/curaredData.json';
const LOG_PREFIX = '[CuratedTest]';

/**
 * Create a CuratedProvider wired to the plugin via direct instantiation.
 * No ServiceManager required.
 *
 * @returns {import('../../libs/services/providers/CuratedProvider.js').default}
 */
function createTestProvider() {
  const plugin = new CuratedPlugin({
    serviceConfig: { baseUrl: CURATED_BASE_URL },
    appConfig: { features: { ENABLE_CURATED: true } },
  });
  return createCuratedProvider(plugin);
}

/**
 * Run all CuratedProvider API calls and collect results.
 *
 * @param {import('../../libs/services/providers/CuratedProvider.js').default} provider
 * @returns {Promise<Array<{ label: string, data: Object|null }>>}
 */
async function runCuratedTests(provider) {
  const results = [];

  // 1. fetchCuratedData
  const allData = await provider.fetchCuratedData();
  console.log(LOG_PREFIX, 'fetchCuratedData', allData);
  results.push({
    label: `fetchCuratedData — ${allData?.files?.length ?? 0} files`,
    data: allData,
  });

  // 2. fetchBySource — one call per source
  const sourceEntries = Object.entries(CuratedSources);
  for (const [key, value] of sourceEntries) {
    // eslint-disable-next-line no-await-in-loop
    const result = await provider.fetchBySource(value);
    console.log(LOG_PREFIX, `fetchBySource("${value}")`, result);
    results.push({
      label: `fetchBySource("${key}") — ${result?.themes?.length ?? 0} themes`,
      data: result,
    });
  }

  // 3. fetchGroupedBySource
  const grouped = await provider.fetchGroupedBySource();
  console.log(LOG_PREFIX, 'fetchGroupedBySource', grouped);
  const summary = grouped
    ? Object.entries(grouped).map(([src, val]) => `${src}: ${val?.themes?.length ?? 0}`).join(', ')
    : 'null';
  results.push({
    label: `fetchGroupedBySource — { ${summary} }`,
    data: grouped,
  });

  return results;
}

/**
 * Render a single result section into the given parent element.
 *
 * @param {HTMLElement} parent
 * @param {{ label: string, data: Object|null }} result
 */
function renderTestResult(parent, { label, data }) {
  const section = document.createElement('details');
  section.open = false;
  section.style.cssText = [
    'margin-bottom:var(--spacing-200, 16px)',
    'border:1px solid var(--color-gray-300, #ccc)',
    'border-radius:4px',
    'padding:var(--spacing-100, 8px)',
  ].join(';');

  const summaryEl = document.createElement('summary');
  summaryEl.style.cssText = 'font-weight:bold;cursor:pointer;';
  summaryEl.textContent = data ? `✅ ${label}` : `❌ ${label} (null)`;
  section.appendChild(summaryEl);

  const pre = document.createElement('pre');
  pre.style.cssText = [
    'max-height:300px',
    'overflow:auto',
    'font-size:12px',
    'white-space:pre-wrap',
    'word-break:break-all',
  ].join(';');
  pre.textContent = JSON.stringify(data, null, 2);
  section.appendChild(pre);

  parent.appendChild(section);
}

/**
 * Render all test results into the block.
 *
 * @param {HTMLElement} container
 * @param {Array<{ label: string, data: Object|null }>} results
 */
function renderAllTestResults(container, results) {
  results.forEach((result) => renderTestResult(container, result));
}

// #endregion --- Curated Test Harness ---

/**
 * Main decorate function - Entry point
 * @param {HTMLElement} block - Block element
 */
export default async function decorate(block) {
  console.log(LOG_PREFIX, 'Block loaded — Curated Plugin Test Harness');

  block.innerHTML = '';
  block.className = 'color-explorer-hybrid';

  const heading = document.createElement('h3');
  heading.textContent = 'Curated Plugin — API Test Harness';
  block.appendChild(heading);

  const resultsContainer = document.createElement('div');
  resultsContainer.style.cssText = 'padding:var(--spacing-100, 8px);';
  block.appendChild(resultsContainer);

  try {
    const provider = createTestProvider();
    const results = await runCuratedTests(provider);
    renderAllTestResults(resultsContainer, results);

    console.log(LOG_PREFIX, 'All calls complete');
  } catch (error) {
    console.error(LOG_PREFIX, 'Error:', error);
    const errEl = document.createElement('p');
    errEl.style.cssText = 'color:var(--color-red-700, red);';
    errEl.textContent = `Test harness error: ${error.message}`;
    resultsContainer.appendChild(errEl);
    block.dataset.failed = 'true';
  }
}
