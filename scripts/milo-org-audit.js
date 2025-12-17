#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander';
import { Octokit } from '@octokit/rest';
import axios from 'axios';

const program = new Command();

program
  .description('Audit an org for Milo/Franklin-style sites')
  .argument(
    '<org>',
    'GitHub org name or full org URL (e.g. https://github.com/adobecom)',
  )
  .option('--token <token>', 'GitHub token (or set GITHUB_TOKEN)')
  .option(
    '--domain-slug <slug>',
    'Domain slug used in aem.page URLs (default: adobecom)',
    'adobecom',
  )
  .option(
    '--branch <branch>',
    'Fallback branch if default branch not reported',
    'main',
  )
  .option(
    '--limit <n>',
    'Optional limit of repos to check (for testing)',
    (v) => parseInt(v, 10),
  )
  .parse(process.argv);

const opts = program.opts();
const argOrg = program.args[0];

const token = opts.token || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Please provide a GitHub token via --token or GITHUB_TOKEN');
  process.exit(1);
}

const org = (() => {
  try {
    const u = new URL(argOrg);
    return u.pathname.replace(/^\//, '').split('/')[0] || argOrg;
  } catch {
    return argOrg;
  }
})();

const octokit = new Octokit({ auth: token });

const headers = { 'User-Agent': 'milo-org-audit' };

async function safeGet(url) {
  try {
    const res = await axios.get(url, { headers, timeout: 8000 });
    return res.data;
  } catch {
    return null;
  }
}

async function headStatus(url) {
  try {
    const res = await axios.head(url, {
      headers,
      maxRedirects: 0,
      timeout: 6000,
      validateStatus: () => true,
    });
    return res.status;
  } catch {
    return null;
  }
}

function scoreRepo(signals) {
  let score = 0;
  if (signals.fstabAdobe) score += 60;
  if (signals.helixAdobe) score += 30;
  if (signals.pkgHelix) score += 20;
  if (signals.blocks) score += 15;
  if (signals.aem200) score += 10;
  return Math.min(100, score);
}

async function checkRepo(repo) {
  const repoName = repo.name;
  const branch = repo.default_branch || opts.branch;
  const baseRaw = `https://raw.githubusercontent.com/${org}/${repoName}/${branch}`;
  const signals = {
    fstabAdobe: false,
    helixAdobe: false,
    pkgHelix: false,
    blocks: false,
    aem200: false,
  };

  const fstab = await safeGet(`${baseRaw}/fstab.yaml`);
  if (fstab && /adobe\.com|adobecom\.aem/.test(fstab)) signals.fstabAdobe = true;

  const helixConfig = await safeGet(`${baseRaw}/helix-config.yaml`);
  if (helixConfig && /adobe\.com|adobecom\.aem/.test(helixConfig)) signals.helixAdobe = true;

  const pkg = await safeGet(`${baseRaw}/package.json`);
  if (pkg) {
    try {
      const parsed = typeof pkg === 'string' ? JSON.parse(pkg) : pkg;
      const deps = { ...(parsed.dependencies || {}), ...(parsed.devDependencies || {}) };
      const depKeys = Object.keys(deps).join(' ');
      if (/@adobe\/helix|@adobe\/sidekick|@adobe\/franklin/i.test(depKeys)) {
        signals.pkgHelix = true;
      }
    } catch {
      // ignore parse errors
    }
  }

  // Check for blocks directories quickly (no content fetch)
  const blocksDir = await headStatus(`https://api.github.com/repos/${org}/${repoName}/contents/blocks`);
  const expressBlocksDir = await headStatus(`https://api.github.com/repos/${org}/${repoName}/contents/express/code/blocks`);
  if (blocksDir === 200 || expressBlocksDir === 200) signals.blocks = true;

  const aemStatus = await headStatus(
    `https://main--${repoName}--${opts.domainSlug}.aem.page/`,
  );
  if (aemStatus === 200) signals.aem200 = true;

  const score = scoreRepo(signals);
  return { repoName, html_url: repo.html_url, score, signals };
}

async function main() {
  console.log(`Scanning org: ${org}`);
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    type: 'public',
    per_page: 100,
  });

  const slice = typeof opts.limit === 'number' ? repos.slice(0, opts.limit) : repos;
  const results = [];
  // Simple concurrency control
  const concurrency = 6;
  let index = 0;
  async function next() {
    if (index >= slice.length) return;
    const current = slice[index];
    index += 1;
    results.push(await checkRepo(current));
    await next();
  }
  const runners = Array.from({ length: Math.min(concurrency, slice.length) }, () => next());
  await Promise.all(runners);

  results.sort((a, b) => b.score - a.score);

  console.log('\n| Repo | Likelihood (%) | Signals |');
  console.log('|------|----------------|---------|');
  results.forEach((r) => {
    const sigList = Object.entries(r.signals)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ') || 'none';
    console.log(`| [${r.repoName}](${r.html_url}) | ${r.score} | ${sigList} |`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
