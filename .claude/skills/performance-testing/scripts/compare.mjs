#!/usr/bin/env node
/**
 * compare.mjs
 *
 * Automates a manual Chrome DevTools performance-comparison workflow: measure
 * Largest Contentful Paint (LCP) for a "test" URL and a "control" URL under
 * standardized mobile throttling, repeat N times each, and report whether the
 * test improved or regressed LCP versus the control.
 *
 * Each run uses a FRESH browser context (cold cache / no shared storage) so
 * results are not skewed by caching between runs — this mirrors a PSI "first
 * view" load. See lib/measure.mjs for throttling/device details and lib/
 * stats.mjs for the confidence-interval verdict.
 *
 * Usage:
 *   node compare.mjs --test <url> --control <url> [options]
 *   node compare.mjs <testUrl> <controlUrl> [options]
 *
 * Run `node compare.mjs --help` for the full option list.
 *
 * Requires: playwright + a Chromium build
 *   npm install playwright && npx playwright install chromium
 */

import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { NETWORK_PROFILES, DEVICE, measureRun } from './lib/measure.mjs';
import { summarize, welch, suggestRuns } from './lib/stats.mjs';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseCli() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      test: { type: 'string' },
      control: { type: 'string' },
      runs: { type: 'string', default: '10' },
      network: { type: 'string', default: 'slow-4g' },
      cpu: { type: 'string', default: '4' },
      settle: { type: 'string', default: '2000' },
      'max-wait': { type: 'string', default: '8000' },
      warmup: { type: 'string', default: '0' },
      confidence: { type: 'string', default: '0.95' },
      'min-delta-ms': { type: 'string', default: '50' },
      'min-pct': { type: 'string', default: '5' },
      timeout: { type: 'string', default: '90000' },
      headed: { type: 'boolean', default: false },
      json: { type: 'string' },
      'api-key': { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const testUrl = values.test || positionals[0];
  const controlUrl = values.control || positionals[1];

  if (!testUrl || !controlUrl) {
    console.error('Error: both a test URL and a control URL are required.\n');
    printHelp();
    process.exit(1);
  }

  const network = String(values.network).toLowerCase();
  if (!NETWORK_PROFILES[network]) {
    console.error(
      `Error: unknown --network "${network}". Choose one of: ${Object.keys(NETWORK_PROFILES).join(', ')}`,
    );
    process.exit(1);
  }

  return {
    testUrl,
    controlUrl,
    runs: toInt(values.runs, 10),
    network,
    cpu: toNum(values.cpu, 4),
    settle: toInt(values.settle, 2000),
    maxWait: toInt(values['max-wait'], 8000),
    warmup: toInt(values.warmup, 0),
    confidence: clamp(toNum(values.confidence, 0.95), 0.5, 0.999),
    minDeltaMs: toNum(values['min-delta-ms'], 50),
    minPct: toNum(values['min-pct'], 5),
    timeout: toInt(values.timeout, 90000),
    headed: values.headed,
    jsonOut: values.json || null,
    // Env var fallback so a key never has to be typed into shell history.
    apiKey: values['api-key'] || process.env.AEM_API_KEY || null,
  };
}

function printHelp() {
  console.log(`
LCP performance comparison (test URL vs control URL)

Usage:
  node compare.mjs --test <url> --control <url> [options]
  node compare.mjs <testUrl> <controlUrl> [options]

Required:
  --test <url>          Test URL (e.g. a preview / branch deploy)
  --control <url>       Control URL (e.g. prod / main)
                        (may also be given as the first two positional args)

Options (defaults reproduce PSI mobile testing):
  --runs <n>            Measured iterations per URL           (default 10)
  --network <profile>   slow-4g | fast-4g | slow-3g | none    (default slow-4g)
  --cpu <rate>          CPU slowdown multiplier               (default 4)
  --settle <ms>         Quiet period with no new LCP candidate
                        before treating it as final           (default 2000)
  --max-wait <ms>       Cap on total time spent waiting for
                        LCP to settle (safety valve)          (default 8000)
  --warmup <n>          Discarded warm-up runs per URL        (default 0)
  --confidence <p>      Confidence level for the delta CI     (default 0.95)
  --min-delta-ms <ms>   Practical-significance floor, ms      (default 50)
  --min-pct <pct>       Practical-significance floor, percent (default 5)
  --timeout <ms>        Per-navigation timeout                (default 90000)
  --headed              Show the browser window (default headless)
  --json <path>         Also write full results as JSON
  --api-key <key>       AEM Admin API key, sent as an "authorization: token"
                        header (also read from AEM_API_KEY env var). See
                        SKILL.md — this is unconfirmed for .aem.page
                        page-view auth, only documented for the Admin API.
  --help                Show this help

Network profiles (Chrome DevTools values; slow-4g == PSI/Lighthouse mobile):
${Object.entries(NETWORK_PROFILES)
  .map(([k, v]) => `  ${k.padEnd(8)} ${v.label}`)
  .join('\n')}
`);
}

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const toNum = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const ms = (v) => (v == null ? '   —  ' : `${Math.round(v)}ms`.padStart(7));
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

function printPerUrl(title, url, runs, summary, plannedRuns) {
  console.log(`\n${bold(title)}  ${dim(url)}`);
  runs.forEach((r, i) => {
    if (r.error) {
      console.log(`  run ${i + 1}: ${red('FAILED')} ${dim(r.error)}`);
    } else if (r.lcp == null) {
      console.log(`  run ${i + 1}: ${red('no LCP entry')} ${dim('(page fired no largest-contentful-paint)')}`);
    } else {
      const d = r.detail;
      const what = d ? dim(`  (${d.tag || '?'}${d.id ? '#' + d.id : ''}${d.url ? ' ' + shortUrl(d.url) : ''})`) : '';
      const warn = r.timedOutWaitingForLcp
        ? red('  ⚠ hit --max-wait before LCP went quiet — may be non-final')
        : '';
      console.log(`  run ${i + 1}: LCP ${ms(r.lcp)}   ${dim(`FCP ${ms(r.fcp)}  TTFB ${ms(r.ttfb)}`)}${what}${warn}`);
    }
  });
  const timedOutCount = runs.filter((r) => r.timedOutWaitingForLcp).length;
  if (timedOutCount > 0) {
    console.log(
      red(
        `  ⚠ ${timedOutCount}/${runs.length} run(s) hit --max-wait before the LCP candidate stopped changing — those values may understate the true LCP. Consider raising --max-wait.`,
      ),
    );
  }
  const lastRun = runs[runs.length - 1];
  if (plannedRuns && runs.length < plannedRuns && lastRun && lastRun.httpStatus) {
    const isAuthWall = lastRun.httpStatus === 401 || lastRun.httpStatus === 403;
    const isAemPage = /\.(aem|hlx)\.page(\/|$|\?)/i.test(url);
    let authHint = '';
    if (isAuthWall && isAemPage) {
      authHint =
        ' .aem.page previews are gated by the AEM Sidekick browser extension, which this tool ' +
        "can't drive (there's no in-page login without it, just this 401). Use the published " +
        '.aem.live URL instead if this content is live, or this skill\'s local-branch mode ' +
        '(clones the branch and serves it via `aem up`, which uses a different, working auth ' +
        'path) if it\'s not. --api-key/AEM_API_KEY is also worth trying but unconfirmed — see SKILL.md.';
    } else if (isAuthWall) {
      authHint = ' Pass --api-key <key> (or set AEM_API_KEY) if this endpoint accepts an Admin API token.';
    }
    console.log(
      red(
        `  ⚠ Stopped after ${runs.length}/${plannedRuns} planned runs — got HTTP ${lastRun.httpStatus}, which won't change on retry.${authHint}`,
      ),
    );
  }
  if (summary) {
    console.log(
      `  ${bold('avg')} ${ms(summary.mean)}   ${dim(
        `median ${ms(summary.median)}  min ${ms(summary.min)}  max ${ms(summary.max)}  stdev ${ms(summary.stdev)}  (n=${summary.n})`,
      )}`,
    );
  } else {
    console.log(`  ${red('no valid runs — cannot compute average')}`);
  }
}

function shortUrl(u) {
  try {
    const url = new URL(u);
    const parts = url.pathname.split('/');
    return parts[parts.length - 1] || url.hostname;
  } catch {
    return u.slice(0, 40);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseCli();

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error(
      '\nError: playwright is not installed.\n' +
        'Install it in an environment with network access:\n\n' +
        '  npm install playwright && npx playwright install chromium\n',
    );
    process.exit(1);
  }

  const profile = NETWORK_PROFILES[opts.network];
  console.log(bold('\nLCP performance comparison'));
  console.log(`  Device:   ${DEVICE.name}  ${DEVICE.viewport.width}x${DEVICE.viewport.height} @ ${DEVICE.deviceScaleFactor}x`);
  console.log(`  CPU:      ${opts.cpu}x slowdown`);
  console.log(`  Network:  ${profile.label}`);
  if (opts.network !== 'none') {
    console.log(
      dim(
        `            ${Math.round((profile.download * 8) / 1000)} kbps down / ${Math.round(
          (profile.upload * 8) / 1000,
        )} kbps up / ${profile.latency}ms latency`,
      ),
    );
  }
  console.log(`  Runs:     ${opts.runs} per URL${opts.warmup ? ` (+${opts.warmup} warm-up discarded)` : ''}`);

  const browser = await chromium.launch({
    headless: !opts.headed,
    args: ['--disable-dev-shm-usage'],
  });

  const targets = [
    { key: 'test', title: 'TEST   ', url: opts.testUrl },
    { key: 'control', title: 'CONTROL', url: opts.controlUrl },
  ];
  const results = {};

  try {
    for (const t of targets) {
      process.stdout.write(dim(`\nMeasuring ${t.title.trim()} (${t.url}) `));
      // Warm-up runs are executed and discarded to prime any cross-request state.
      for (let w = 0; w < opts.warmup; w++) {
        await measureRun(browser, t.url, opts);
        process.stdout.write(dim('·'));
      }
      const runs = [];
      for (let i = 0; i < opts.runs; i++) {
        const r = await measureRun(browser, t.url, opts);
        runs.push(r);
        process.stdout.write(r.error || r.lcp == null ? red('x') : green('•'));
        // A real HTTP-status failure (401, 404, 500, ...) won't fix itself on
        // the next attempt — stop wasting the remaining runs on it. A
        // transient/timeout error (no httpStatus) is worth retrying, so only
        // this specific case short-circuits the loop.
        if (r.httpStatus) {
          process.stdout.write(dim(` (HTTP ${r.httpStatus} — stopping, retrying won't help)`));
          break;
        }
      }
      results[t.key] = { url: t.url, runs, summary: summarize(runs) };
    }
  } finally {
    await browser.close();
  }
  console.log('');

  printPerUrl('TEST   ', results.test.url, results.test.runs, results.test.summary, opts.runs);
  printPerUrl('CONTROL', results.control.url, results.control.runs, results.control.summary, opts.runs);

  // Verdict — based on a confidence interval for the difference of means.
  console.log(`\n${bold('─'.repeat(60))}`);
  const ts = results.test.summary;
  const cs = results.control.summary;
  const confPct = Math.round(opts.confidence * 100);

  let verdictPayload = null;
  if (!ts || !cs) {
    console.log(red('Cannot produce a verdict: one or both URLs had no valid runs.'));
  } else {
    const delta = ts.mean - cs.mean; // negative = test is faster = improvement
    const pct = (delta / cs.mean) * 100;
    const dir = delta < 0 ? 'faster' : 'slower';

    console.log(
      `${bold('Test avg')} ${Math.round(ts.mean)}ms   ${bold('Control avg')} ${Math.round(
        cs.mean,
      )}ms   ${dim(`(n=${ts.n} / ${cs.n})`)}`,
    );
    console.log(
      `${bold('Delta')} ${delta >= 0 ? '+' : ''}${Math.round(delta)}ms (${pct >= 0 ? '+' : ''}${pct.toFixed(
        1,
      )}%) — test is ${Math.abs(Math.round(delta))}ms ${dir} than control`,
    );

    const stats = welch(ts, cs, opts.confidence);
    if (!stats) {
      console.log(dim('  Need ≥ 2 valid runs per URL for a confidence interval.'));
      console.log(`\n${bold('Verdict:')} ${dim(bold('INSUFFICIENT DATA'))}`);
      verdictPayload = { testMean: ts.mean, controlMean: cs.mean, deltaMs: delta, pctChange: pct, verdict: 'INSUFFICIENT DATA' };
    } else {
      const [lo, hi] = stats.ci;
      console.log(
        dim(
          `${confPct}% CI on delta: [${lo >= 0 ? '+' : ''}${Math.round(lo)}, ${hi >= 0 ? '+' : ''}${Math.round(
            hi,
          )}] ms   Welch t=${stats.t.toFixed(2)}, df=${stats.df.toFixed(1)}, p=${stats.p.toFixed(3)}`,
        ),
      );

      const significant = lo > 0 || hi < 0; // whole interval on one side of zero
      let verdict;
      let color;
      if (!significant) {
        verdict = 'NO SIGNIFICANT DIFFERENCE';
        color = dim;
      } else if (delta < 0) {
        verdict = 'IMPROVED';
        color = green;
      } else {
        verdict = 'REGRESSED';
        color = red;
      }
      console.log(`\n${bold('Verdict:')} ${color(bold(verdict))}`);

      const practicallyMeaningful = Math.abs(delta) >= opts.minDeltaMs && Math.abs(pct) >= opts.minPct;
      if (!significant) {
        console.log(
          dim(
            `  The ${confPct}% CI includes 0 — this delta is not distinguishable from run-to-run noise at n=${ts.n}.`,
          ),
        );
        const need = suggestRuns(ts, cs, delta, opts.confidence);
        if (need && need > ts.n) {
          console.log(
            dim(
              `  To resolve a difference this size (~${Math.abs(pct).toFixed(
                1,
              )}%) you'd need roughly ${need} runs per URL (80% power). Re-run with --runs ${need}.`,
            ),
          );
        }
      } else if (!practicallyMeaningful) {
        console.log(
          dim(
            `  Statistically real, but small (< ${opts.minDeltaMs}ms and < ${opts.minPct}%) — may not be user-perceptible.`,
          ),
        );
      }

      verdictPayload = {
        testMean: ts.mean,
        controlMean: cs.mean,
        deltaMs: delta,
        pctChange: pct,
        confidence: opts.confidence,
        ci: stats.ci,
        welchT: stats.t,
        df: stats.df,
        pValue: stats.p,
        significant,
        practicallyMeaningful,
        verdict,
      };
    }
  }
  console.log(bold('─'.repeat(60)));

  if (opts.jsonOut) {
    const fs = await import('node:fs');
    const payload = {
      config: {
        device: DEVICE.name,
        viewport: DEVICE.viewport,
        deviceScaleFactor: DEVICE.deviceScaleFactor,
        cpuThrottling: opts.cpu,
        network: opts.network,
        networkProfile: profile,
        runs: opts.runs,
        warmup: opts.warmup,
        settleMs: opts.settle,
      },
      test: results.test,
      control: results.control,
      verdict: verdictPayload,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(opts.jsonOut, JSON.stringify(payload, null, 2));
    console.log(dim(`\nFull results written to ${opts.jsonOut}`));
  }

  // Exit non-zero on regression so this is usable as a CI gate.
  if (verdictPayload && verdictPayload.verdict === 'REGRESSED') process.exit(2);
}

// Only run when invoked directly (so the stats/measure helpers can be
// imported by other scripts, e.g. a future report.mjs, without side effects).
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  main().catch((e) => {
    console.error('\nUnexpected error:', e);
    process.exit(1);
  });
}
