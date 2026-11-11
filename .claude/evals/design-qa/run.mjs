#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const CASES_PATH = resolve(HERE, 'cases.json');
const SEVERITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'in',
  'is', 'it', 'of', 'on', 'or', 'the', 'to', 'use', 'uses', 'with', 'without',
]);

function findingWeight({ severity }) {
  return SEVERITY_WEIGHT[severity] || 1;
}

function sumFindingWeights(findings) {
  return findings.reduce((sum, finding) => sum + findingWeight(finding), 0);
}

function parseArgs(argv) {
  const [command = 'help', ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];
    if (!value.startsWith('--')) throw new Error(`Unexpected argument: ${value}`);
    const [rawKey, inlineValue] = value.slice(2).split('=', 2);
    const next = rest[index + 1];
    if (inlineValue !== undefined) options[rawKey] = inlineValue;
    else if (next && !next.startsWith('--')) {
      options[rawKey] = next;
      index += 1;
    } else options[rawKey] = true;
  }
  return { command, options };
}

function loadDataset() {
  return JSON.parse(readFileSync(CASES_PATH, 'utf8'));
}

function findCase(dataset, id) {
  const found = dataset.cases.find((entry) => entry.id === id || entry.ticket === id);
  if (!found) throw new Error(`Unknown case: ${id}`);
  return found;
}

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commitExists(commit) {
  try {
    git(['cat-file', '-e', `${commit}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function isAncestor(ancestor, descendant) {
  try {
    git(['merge-base', '--is-ancestor', ancestor, descendant]);
    return true;
  } catch {
    return false;
  }
}

function pathExistsAt(commit, path) {
  try {
    git(['cat-file', '-e', `${commit}:${path}`]);
    return true;
  } catch {
    return false;
  }
}

function scopedDelta(from, to, paths) {
  const output = git(['diff', '--numstat', from, to, '--', ...paths]);
  if (!output) return 0;
  return output.split('\n').reduce((total, line) => {
    const [added, removed] = line.split('\t');
    if (added === '-' || removed === '-') return total + 1;
    return total + Number(added || 0) + Number(removed || 0);
  }, 0);
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(normalize(value).split(' ').filter((token) => token && !STOP_WORDS.has(token)));
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  left.forEach((value) => {
    if (right.has(value)) intersection += 1;
  });
  return intersection / (left.size + right.size - intersection);
}

function findingSimilarity(submitted, expected) {
  const declaredId = submitted.oracleId || submitted.id;
  if (declaredId === expected.id) return 1;

  const text = normalize([
    submitted.description,
    submitted.summary,
    submitted.category,
    submitted.viewport,
    submitted.state,
    submitted.ownership,
  ].filter(Boolean).join(' '));
  const expectedText = normalize([
    expected.description,
    ...(expected.keywords || []),
    expected.category,
    expected.viewport,
    expected.state,
    expected.ownership,
  ].filter(Boolean).join(' '));

  const keywordHits = (expected.keywords || [])
    .filter((keyword) => text.includes(normalize(keyword))).length;
  const keywordScore = expected.keywords?.length ? keywordHits / expected.keywords.length : 0;
  const textScore = jaccard(tokens(text), tokens(expectedText));
  const categoryScore = submitted.category === expected.category ? 1 : 0;
  const viewportScore = submitted.viewport && expected.viewport
    && normalize(submitted.viewport).includes(normalize(expected.viewport)) ? 1 : 0;
  const stateScore = submitted.state && expected.state
    && normalize(submitted.state).includes(normalize(expected.state)) ? 1 : 0;
  const ownershipScore = submitted.ownership === expected.ownership ? 1 : 0;

  return (keywordScore * 0.55)
    + (textScore * 0.25)
    + (categoryScore * 0.1)
    + (viewportScore * 0.04)
    + (stateScore * 0.03)
    + (ownershipScore * 0.03);
}

function matchFindings(submitted, expected) {
  const candidates = [];
  submitted.forEach((actual, actualIndex) => {
    expected.forEach((oracle, oracleIndex) => {
      candidates.push({
        actualIndex,
        oracleIndex,
        similarity: findingSimilarity(actual, oracle),
      });
    });
  });
  candidates.sort((a, b) => b.similarity - a.similarity);

  const actualUsed = new Set();
  const oracleUsed = new Set();
  const matches = [];
  candidates.forEach((candidate) => {
    if (candidate.similarity < 0.42
      || actualUsed.has(candidate.actualIndex)
      || oracleUsed.has(candidate.oracleIndex)) return;
    actualUsed.add(candidate.actualIndex);
    oracleUsed.add(candidate.oracleIndex);
    matches.push({
      ...candidate,
      submitted: submitted[candidate.actualIndex],
      expected: expected[candidate.oracleIndex],
    });
  });

  return {
    matches,
    missed: expected.filter((_, index) => !oracleUsed.has(index)),
    novel: submitted.filter((_, index) => !actualUsed.has(index)),
  };
}

function scoreSubmission(testCase, submission, candidateRef) {
  const expected = testCase.oracle.findings;
  const submitted = Array.isArray(submission.findings) ? submission.findings : [];
  const { matches, missed, novel } = matchFindings(submitted, expected);
  const totalWeight = sumFindingWeights(expected);
  const caughtWeight = sumFindingWeights(matches.map((match) => match.expected));
  const weightedRecall = totalWeight ? caughtWeight / totalWeight : 1;
  const expectedCategories = new Set(expected.map((finding) => finding.category));
  const caughtCategories = new Set(matches.map((match) => match.expected.category));
  const categoryCoverage = expectedCategories.size
    ? caughtCategories.size / expectedCategories.size : 1;
  const evidencedMatches = matches.filter((match) => {
    const { evidence } = match.submitted;
    return Array.isArray(evidence) ? evidence.length > 0 : Boolean(evidence);
  }).length;
  const evidenceCoverage = matches.length ? evidencedMatches / matches.length : 0;

  let codeCloseness = null;
  let codeDelta = null;
  if (candidateRef) {
    if (!commitExists(candidateRef)) throw new Error(`Candidate ref does not exist: ${candidateRef}`);
    const initialGap = scopedDelta(
      testCase.initial.commit,
      testCase.final.commit,
      testCase.scope.paths,
    );
    const remainingGap = scopedDelta(candidateRef, testCase.final.commit, testCase.scope.paths);
    if (initialGap === 0) codeCloseness = remainingGap === 0 ? 1 : 0;
    else {
      codeCloseness = Math.max(0, 1 - Math.min(1, remainingGap / initialGap));
    }
    codeDelta = { initialToFinal: initialGap, candidateToFinal: remainingGap };
  }

  const reward = codeCloseness === null
    ? (weightedRecall * 0.7) + (categoryCoverage * 0.2) + (evidenceCoverage * 0.1)
    : (weightedRecall * 0.5) + (categoryCoverage * 0.15)
      + (evidenceCoverage * 0.1) + (codeCloseness * 0.25);

  const rounds = [...new Set(expected.map((finding) => finding.round))].sort((a, b) => a - b);
  const recallByHistoricalRound = Object.fromEntries(rounds.map((round) => {
    const roundFindings = expected.filter((finding) => finding.round === round);
    const caughtIds = new Set(matches.map((match) => match.expected.id));
    const caught = roundFindings.filter((finding) => caughtIds.has(finding.id));
    const roundWeight = sumFindingWeights(roundFindings);
    const caughtRoundWeight = sumFindingWeights(caught);
    return [round, {
      caught: caught.length,
      total: roundFindings.length,
      weightedRecall: roundWeight ? caughtRoundWeight / roundWeight : 1,
    }];
  }));

  return {
    case: testCase.id,
    ticket: testCase.ticket,
    evaluatedPass: Number(submission.pass || 1),
    reward: Number(reward.toFixed(4)),
    metrics: {
      weightedFindingRecall: Number(weightedRecall.toFixed(4)),
      categoryCoverage: Number(categoryCoverage.toFixed(4)),
      evidenceCoverage: Number(evidenceCoverage.toFixed(4)),
      codeCloseness: codeCloseness === null ? null : Number(codeCloseness.toFixed(4)),
      codeDelta,
      recallByHistoricalRound,
    },
    matches: matches.map((match) => ({
      expectedId: match.expected.id,
      similarity: Number(match.similarity.toFixed(4)),
      submittedDescription: match.submitted.description || match.submitted.summary || '',
    })),
    missed: missed.map((finding) => ({
      id: finding.id,
      round: finding.round,
      severity: finding.severity,
      description: finding.description,
    })),
    novel: novel.map((finding) => ({
      description: finding.description || finding.summary || '',
      category: finding.category || null,
      note: 'Not penalized; requires human adjudication as a possible valid novel finding.',
    })),
  };
}

function validateDataset(dataset) {
  const errors = [];
  const warnings = [];
  const caseIds = new Set();
  const tickets = new Set();

  if (dataset.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (!Array.isArray(dataset.cases) || dataset.cases.length === 0) {
    errors.push('cases must be a non-empty array');
    return { errors, warnings };
  }

  dataset.cases.forEach((testCase) => {
    const prefix = testCase.id || '<missing-id>';
    if (!testCase.id || caseIds.has(testCase.id)) errors.push(`${prefix}: duplicate/missing id`);
    caseIds.add(testCase.id);
    if (!testCase.ticket || tickets.has(testCase.ticket)) errors.push(`${prefix}: duplicate/missing ticket`);
    tickets.add(testCase.ticket);

    for (const boundary of ['initial', 'final']) {
      const commit = testCase[boundary]?.commit;
      if (!commit || !commitExists(commit)) errors.push(`${prefix}: invalid ${boundary} commit ${commit}`);
    }
    if (testCase.initial?.commit === testCase.final?.commit) {
      errors.push(`${prefix}: initial and final commits are identical`);
    }
    if (testCase.historyMode && testCase.historyMode !== 'squash') {
      errors.push(`${prefix}: invalid historyMode ${testCase.historyMode}`);
    }
    if (commitExists(testCase.initial?.commit) && commitExists(testCase.final?.commit)
      && !isAncestor(testCase.initial.commit, testCase.final.commit)
      && testCase.historyMode !== 'squash') {
      errors.push(`${prefix}: initial commit is not an ancestor of final commit`);
    }
    for (const boundary of ['initial', 'final']) {
      if (!['high', 'medium', 'low'].includes(testCase[boundary]?.confidence)) {
        errors.push(`${prefix}: invalid ${boundary} confidence`);
      }
      if (!testCase[boundary]?.rationale) errors.push(`${prefix}: missing ${boundary} rationale`);
      if (Number.isNaN(Date.parse(testCase[boundary]?.timestamp))) {
        errors.push(`${prefix}: invalid ${boundary} timestamp`);
      }
    }
    (testCase.checkpoints || []).forEach((checkpoint) => {
      if (!commitExists(checkpoint.commit)) {
        errors.push(`${prefix}: invalid checkpoint commit ${checkpoint.commit}`);
      } else if (testCase.historyMode !== 'squash'
        && (!isAncestor(testCase.initial.commit, checkpoint.commit)
          || !isAncestor(checkpoint.commit, testCase.final.commit))) {
        warnings.push(`${prefix}: checkpoint is outside the initial-to-final ancestry: ${checkpoint.commit}`);
      }
    });

    const paths = testCase.scope?.paths || [];
    if (paths.length === 0) errors.push(`${prefix}: scope.paths is empty`);
    paths.forEach((path) => {
      if (!pathExistsAt(testCase.initial.commit, path)
        && !pathExistsAt(testCase.final.commit, path)) {
        errors.push(`${prefix}: path absent from both boundaries: ${path}`);
      }
    });

    const findingIds = new Set();
    const findings = testCase.oracle?.findings || [];
    if (findings.length === 0) errors.push(`${prefix}: no oracle findings`);
    findings.forEach((finding) => {
      if (!finding.id || findingIds.has(finding.id)) errors.push(`${prefix}: duplicate/missing finding id ${finding.id}`);
      findingIds.add(finding.id);
      if (!SEVERITY_WEIGHT[finding.severity]) errors.push(`${prefix}/${finding.id}: invalid severity`);
      if (!Array.isArray(finding.keywords) || finding.keywords.length < 2) {
        errors.push(`${prefix}/${finding.id}: requires at least two matching keywords`);
      }
      if (!Number.isInteger(finding.round) || finding.round < 1
        || finding.round > (testCase.feedbackRounds || []).length) {
        errors.push(`${prefix}/${finding.id}: finding round has no matching feedback round`);
      }
    });

    let priorRound = 0;
    (testCase.feedbackRounds || []).forEach((round) => {
      if (round.round <= priorRound) errors.push(`${prefix}: feedback rounds are not increasing`);
      priorRound = round.round;
    });
    if (priorRound !== (testCase.feedbackRounds || []).length) {
      errors.push(`${prefix}: feedback round numbers must be contiguous from 1`);
    }

    (testCase.figma || []).forEach((node) => {
      if (!/^[A-Za-z0-9]+$/.test(node.fileKey || '')) errors.push(`${prefix}: invalid Figma file key`);
      if (!/^\d+:\d+$/.test(node.nodeId || '')) errors.push(`${prefix}: invalid Figma node ${node.nodeId}`);
      if (!Number.isInteger(node.round) || node.round < 0 || node.round > priorRound) {
        errors.push(`${prefix}: invalid Figma reveal round ${node.round}`);
      }
      if (!node.label) errors.push(`${prefix}: Figma node is missing a label`);
    });
    if (!/^https:\/\//.test(testCase.scope?.candidateUrl || '')) {
      errors.push(`${prefix}: candidateUrl must be an absolute HTTPS URL`);
    }
    const delta = commitExists(testCase.initial?.commit) && commitExists(testCase.final?.commit)
      ? scopedDelta(testCase.initial.commit, testCase.final.commit, paths) : 0;
    if (delta === 0) warnings.push(`${prefix}: no scoped code delta between initial and final`);
  });

  return { errors, warnings };
}

function figmaUrl(node) {
  return `https://www.figma.com/design/${node.fileKey}/?node-id=${node.nodeId.replace(':', '-')}`;
}

function promptForPass(testCase, pass) {
  const revealedRound = Math.max(0, pass - 1);
  const visibleFigma = testCase.figma.filter((node) => node.round <= revealedRound);
  const visibleFeedback = testCase.feedbackRounds.filter((round) => round.round <= revealedRound);
  const lines = [
    `# Design QA evaluation: ${testCase.ticket}`,
    '',
    `Title: ${testCase.title}`,
    `Evaluation pass: ${pass}`,
    `Starting commit: ${testCase.initial.commit}`,
    `Historical branch: ${testCase.implementationBranch}`,
    `Candidate URL: ${testCase.scope.candidateUrl}`,
    testCase.scope.baselineUrl ? `Baseline URL: ${testCase.scope.baselineUrl}` : null,
    `Target browsers: ${testCase.scope.browsers.join(', ')}`,
    `Target locales: ${testCase.scope.locales.join(', ')}`,
    '',
    'Run the design-qa skill against the starting content. Ask for missing design-critical information, inspect the implementation, and return a findings JSON submission. Do not inspect the hidden final commit or oracle.',
    '',
    '## Initially available design references',
    ...(visibleFigma.length
      ? visibleFigma.map((node) => `- ${node.label}: ${figmaUrl(node)}`)
      : [`- None supplied.${testCase.referenceGap ? ` ${testCase.referenceGap}` : ''}`]),
    '',
    '## Feedback revealed before this pass',
    ...(visibleFeedback.length
      ? visibleFeedback.map((round) => `- Round ${round.round}: ${round.summary}`)
      : ['- None. This is the single-pass evaluation from initial content.']),
    '',
    '## Submission shape',
    '```json',
    '{',
    `  "case": "${testCase.id}",`,
    `  "pass": ${pass},`,
    '  "findings": [',
    '    {',
    '      "description": "observable issue",',
    '      "category": "responsive|spacing|typography|visual|interaction|accessibility|content-authoring|source-of-truth|localization",',
    '      "viewport": "exact viewport/range when relevant",',
    '      "state": "interaction state when relevant",',
    '      "ownership": "implementation|authoring|design|environment|localization",',
    '      "evidence": ["screenshot, measurement, DOM/style observation, or reproduction"]',
    '    }',
    '  ]',
    '}',
    '```',
  ].filter((line) => line !== null);
  return lines.join('\n');
}

function printHelp() {
  process.stdout.write('Design QA historical evaluation environment\n\n');
  process.stdout.write('Commands:\n');
  process.stdout.write('  validate\n');
  process.stdout.write('  list [--json]\n');
  process.stdout.write('  prompt --case <id|ticket> [--pass <n>]\n');
  process.stdout.write('  plan --case <id|ticket>\n');
  process.stdout.write('  materialize --case <id|ticket> --dest <directory>\n');
  process.stdout.write('  score --case <id|ticket> --submission <json> [--candidate-ref <ref>]\n');
}

function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  if (command === 'help' || options.help) {
    printHelp();
    return;
  }

  const dataset = loadDataset();
  if (command === 'validate') {
    const result = validateDataset(dataset);
    process.stdout.write(`${JSON.stringify({
      status: result.errors.length ? 'invalid' : 'valid',
      cases: dataset.cases.length,
      findings: dataset.cases.reduce((sum, entry) => sum + entry.oracle.findings.length, 0),
      ...result,
    }, null, 2)}\n`);
    if (result.errors.length) process.exitCode = 1;
    return;
  }

  if (command === 'list') {
    const rows = dataset.cases.map((entry) => ({
      id: entry.id,
      ticket: entry.ticket,
      title: entry.title,
      feedbackRounds: entry.feedbackRounds.length,
      findings: entry.oracle.findings.length,
      figmaNodes: entry.figma.length,
      initialConfidence: entry.initial.confidence,
      finalConfidence: entry.final.confidence,
    }));
    if (options.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    else {
      rows.forEach((row) => process.stdout.write(
        `${row.ticket}\t${row.id}\t${row.feedbackRounds} rounds\t${row.findings} findings\t${row.figmaNodes} Figma nodes\n`,
      ));
    }
    return;
  }

  if (!options.case) throw new Error(`${command} requires --case <id|ticket>`);
  const testCase = findCase(dataset, options.case);

  if (command === 'prompt') {
    const pass = Number(options.pass || 1);
    if (!Number.isInteger(pass) || pass < 1 || pass > testCase.feedbackRounds.length + 1) {
      throw new Error(`Pass must be between 1 and ${testCase.feedbackRounds.length + 1}`);
    }
    process.stdout.write(`${promptForPass(testCase, pass)}\n`);
    return;
  }

  if (command === 'plan') {
    process.stdout.write(`${JSON.stringify({
      case: testCase.id,
      ticket: testCase.ticket,
      startingCommit: testCase.initial,
      hiddenFinalCommit: testCase.final,
      checkpoints: testCase.checkpoints,
      scope: testCase.scope,
      materializeCommand: `node .claude/evals/design-qa/run.mjs materialize --case ${testCase.id} --dest <path>`,
      firstPassPromptCommand: `node .claude/evals/design-qa/run.mjs prompt --case ${testCase.id} --pass 1`,
      scoreCommand: `node .claude/evals/design-qa/run.mjs score --case ${testCase.id} --submission <result.json> --candidate-ref <attempt-commit>`,
    }, null, 2)}\n`);
    return;
  }

  if (command === 'materialize') {
    if (!options.dest) throw new Error('materialize requires --dest <directory>');
    const destination = isAbsolute(options.dest) ? options.dest : resolve(ROOT, options.dest);
    if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`);
    execFileSync('git', ['worktree', 'add', '--detach', destination, testCase.initial.commit], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    process.stdout.write(`${JSON.stringify({
      case: testCase.id,
      commit: testCase.initial.commit,
      worktree: destination,
      promptCommand: `node ${resolve(HERE, 'run.mjs')} prompt --case ${testCase.id} --pass 1`,
    }, null, 2)}\n`);
    return;
  }

  if (command === 'score') {
    if (!options.submission) throw new Error('score requires --submission <json>');
    const submissionPath = isAbsolute(options.submission)
      ? options.submission : resolve(process.cwd(), options.submission);
    const submission = JSON.parse(readFileSync(submissionPath, 'utf8'));
    const result = scoreSubmission(testCase, submission, options['candidate-ref'] || null);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

export {
  findCase,
  findingSimilarity,
  loadDataset,
  matchFindings,
  promptForPass,
  scoreSubmission,
  scopedDelta,
  validateDataset,
};
