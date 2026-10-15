import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'package-report.mjs');

function fakeLog() {
  return {
    block: 'ax-columns',
    base: 'stage',
    branch: 'my-branch',
    mode: 'element',
    threshold: 0.1,
    generatedAt: '2026-01-01T00:00:00.000Z',
    stats: {
      total: 4,
      identical: 1,
      minor: 1,
      major: 1,
      baselineOnly404: 0,
      branchOnly404: 0,
      bothErrored: 1,
      missing: 0,
    },
    statsByLocale: {
      en: {
        total: 4,
        identical: 1,
        minor: 1,
        major: 1,
        baselineOnly404: 0,
        branchOnly404: 0,
        bothErrored: 1,
        missing: 0,
      },
    },
    pages: [
      {
        path: '/express/identical-page',
        locale: 'en',
        baseUrl: 'https://stage.example/express/identical-page',
        branchUrl: 'https://my-branch.example/express/identical-page',
        baseStatus: 'ok',
        branchStatus: 'ok',
        element: { mismatchPct: 0.1, diffImage: '/does/not/exist.png', heightDeltaPx: 0 },
      },
      {
        path: '/express/minor-page',
        locale: 'en',
        baseUrl: 'https://stage.example/express/minor-page',
        branchUrl: 'https://my-branch.example/express/minor-page',
        baseStatus: 'ok',
        branchStatus: 'ok',
        element: { mismatchPct: 1.5, diffImage: '/does/not/exist.png', heightDeltaPx: 10 },
      },
      {
        path: '/express/major-page',
        locale: 'jp',
        baseUrl: 'https://stage.example/jp/express/major-page',
        branchUrl: 'https://my-branch.example/jp/express/major-page',
        baseStatus: 'ok',
        branchStatus: 'ok',
        element: { mismatchPct: 12.3, diffImage: '/does/not/exist.png', heightDeltaPx: 80 },
      },
      {
        path: '/express/broken-page',
        locale: 'en',
        baseUrl: 'https://stage.example/express/broken-page',
        branchUrl: 'https://my-branch.example/express/broken-page',
        baseStatus: 'error',
        branchStatus: 'error',
        element: { skipped: 'both sides failed (base: error, branch: error)' },
      },
    ],
  };
}

async function withTempLog(t, log) {
  const dir = await mkdtemp(join(tmpdir(), 'package-report-test-'));
  const input = join(dir, 'comparison.json');
  await writeFile(input, JSON.stringify(log));
  return { dir, input };
}

test('generates a report with one row per page and no images (files do not exist on disk)', async (t) => {
  const { dir, input } = await withTempLog(t, fakeLog());
  const output = join(dir, 'report.html');
  const { stdout } = await execFileAsync('node', [SCRIPT, `--input=${input}`, `--output=${output}`]);
  const result = JSON.parse(stdout);

  assert.equal(result.pagesIncluded, 4);
  assert.equal(result.imagesEmbedded, 0); // diffImage paths don't exist on disk

  const html = await readFile(output, 'utf8');
  assert.match(html, /identical-page/);
  assert.match(html, /minor-page/);
  assert.match(html, /major-page/);
  assert.match(html, /broken-page/);
});

test('--locale filters the report down to matching pages only', async (t) => {
  const { dir, input } = await withTempLog(t, fakeLog());
  const output = join(dir, 'report.html');
  const { stdout } = await execFileAsync('node', [SCRIPT, `--input=${input}`, `--output=${output}`, '--locale=jp']);
  const result = JSON.parse(stdout);

  assert.equal(result.pagesIncluded, 1);
  const html = await readFile(output, 'utf8');
  assert.match(html, /major-page/);
  assert.doesNotMatch(html, /minor-page/);
});

test('--bucket filters the report down to matching buckets only', async (t) => {
  const { dir, input } = await withTempLog(t, fakeLog());
  const output = join(dir, 'report.html');
  const { stdout } = await execFileAsync('node', [SCRIPT, `--input=${input}`, `--output=${output}`, '--bucket=bothErrored']);
  const result = JSON.parse(stdout);

  assert.equal(result.pagesIncluded, 1);
  const html = await readFile(output, 'utf8');
  assert.match(html, /broken-page/);
  assert.doesNotMatch(html, /identical-page/);
});

test('rejects a missing --input', async () => {
  await assert.rejects(() => execFileAsync('node', [SCRIPT]));
});

test('rejects an --input that is itself an error log', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'package-report-test-'));
  const input = join(dir, 'comparison.json');
  await writeFile(input, JSON.stringify({ error: 'something went wrong upstream' }));
  await assert.rejects(() => execFileAsync('node', [SCRIPT, `--input=${input}`]));
});
