/* eslint-disable import/extensions */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findCase,
  findingSimilarity,
  loadDataset,
  promptForPass,
  scoreSubmission,
  validateDataset,
} from './run.mjs';

const dataset = loadDataset();

test('historical dataset is internally valid', () => {
  const result = validateDataset(dataset);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(dataset.cases.length, 9);
  assert.equal(
    dataset.cases.reduce((sum, entry) => sum + entry.oracle.findings.length, 0),
    77,
  );
});

test('first pass hides historical feedback and later Figma nodes', () => {
  const testCase = findCase(dataset, 'MWPW-202514');
  const firstPass = promptForPass(testCase, 1);
  const secondPass = promptForPass(testCase, 2);

  assert.match(firstPass, /None\. This is the single-pass evaluation/);
  assert.doesNotMatch(firstPass, /22765-3109/);
  assert.match(secondPass, /22765-3109/);
  assert.match(secondPass, /Align the first card/);
  assert.doesNotMatch(secondPass, /Tablet card geometry/);
});

test('semantic matcher recognizes a responsive card finding', () => {
  const testCase = findCase(dataset, 'MWPW-202514');
  const expected = testCase.oracle.findings.find((finding) => finding.id === 'cards-1440-overflow');
  const similarity = findingSimilarity({
    description: 'At 1440px the cards are 382px and bleed beyond the viewport; they should remain 322px.',
    category: 'responsive',
    viewport: '1440px',
    ownership: 'implementation',
  }, expected);

  assert.ok(similarity >= 0.42, `expected a match, received ${similarity}`);
});

test('exact oracle ids produce complete finding recall', () => {
  const testCase = findCase(dataset, 'MWPW-192501');
  const submission = {
    pass: 1,
    findings: testCase.oracle.findings.map((finding) => ({
      oracleId: finding.id,
      description: finding.description,
      evidence: ['measured in browser'],
    })),
  };
  const result = scoreSubmission(testCase, submission, null);

  assert.equal(result.metrics.weightedFindingRecall, 1);
  assert.equal(result.metrics.categoryCoverage, 1);
  assert.equal(result.metrics.evidenceCoverage, 1);
  assert.equal(result.missed.length, 0);
});

test('code closeness distinguishes initial and final refs', () => {
  const testCase = findCase(dataset, 'MWPW-192501');
  const emptySubmission = { pass: 1, findings: [] };
  const initial = scoreSubmission(testCase, emptySubmission, testCase.initial.commit);
  const final = scoreSubmission(testCase, emptySubmission, testCase.final.commit);

  assert.equal(initial.metrics.codeCloseness, 0);
  assert.equal(final.metrics.codeCloseness, 1);
  assert.ok(initial.metrics.codeDelta.initialToFinal > 0);
});

test('novel findings are preserved for human adjudication', () => {
  const testCase = findCase(dataset, 'MWPW-194122');
  const result = scoreSubmission(testCase, {
    pass: 1,
    findings: [{
      description: 'The drawer emits an unexpected console error.',
      category: 'interaction',
      evidence: ['console trace'],
    }],
  }, null);

  assert.equal(result.novel.length, 1);
  assert.match(result.novel[0].note, /Not penalized/);
});
